import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_TOKEN })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const casePageId = formData.get('casePageId') as string | null
    const label = (formData.get('label') as string) || file?.name || '附件'

    if (!file) return NextResponse.json({ error: '未提供檔案' }, { status: 400 })
    if (!casePageId) return NextResponse.json({ error: '未提供案件頁面 ID' }, { status: 400 })

    // 1. 上傳到 Vercel Blob
    const blob = await put(`yufeng/${casePageId}/${Date.now()}_${file.name}`, file, {
      access: 'public',
      contentType: file.type,
    })

    // 2. 讀取案件頁面現有 content，在結尾加 bookmark block
    // Notion API: append blocks to page
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks: any[] = []

    if (isImage) {
      blocks.push({
        object: 'block',
        type: 'image',
        image: { type: 'external', external: { url: blob.url } },
      })
    } else {
      // PDF 或其他：用 bookmark（可在 Notion 預覽連結）+ 備份 file block
      blocks.push({
        object: 'block',
        type: 'bookmark',
        bookmark: {
          url: blob.url,
          caption: [{ type: 'text', text: { content: label } }],
        },
      })
    }

    // 加說明段落
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: {
            content: `📎 ${label}`,
            link: { url: blob.url },
          },
          annotations: { color: 'blue' },
        }],
      },
    })

    await notion.blocks.children.append({
      block_id: casePageId,
      children: blocks,
    })

    return NextResponse.json({ url: blob.url, name: file.name, size: file.size })
  } catch (err: unknown) {
    console.error('Upload error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// list files already in a case page (by reading bookmark/image blocks)
export async function GET(req: NextRequest) {
  const casePageId = req.nextUrl.searchParams.get('casePageId')
  if (!casePageId) return NextResponse.json([], { status: 400 })

  try {
    const res = await notion.blocks.children.list({ block_id: casePageId })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const files: any[] = []
    for (const block of res.results as any[]) {
      if (block.type === 'image' && block.image?.external?.url) {
        files.push({ type: 'image', url: block.image.external.url, blockId: block.id })
      } else if (block.type === 'bookmark' && block.bookmark?.url) {
        const caption = block.bookmark.caption?.[0]?.text?.content || block.bookmark.url
        files.push({ type: 'file', url: block.bookmark.url, name: caption, blockId: block.id })
      }
    }
    return NextResponse.json(files)
  } catch (err) {
    return NextResponse.json([])
  }
}

// delete a block (remove attachment from Notion page)
export async function DELETE(req: NextRequest) {
  const { blockId } = await req.json()
  if (!blockId) return NextResponse.json({ error: 'no blockId' }, { status: 400 })
  try {
    await notion.blocks.delete({ block_id: blockId })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
