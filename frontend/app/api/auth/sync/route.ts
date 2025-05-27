import { createClient } from '@/app/lib/supabase-auth/server'
import { NextResponse } from 'next/server'
import { Pool } from 'pg'

// 既存のPostgreSQL接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Supabaseのプロフィール情報を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // 既存のPostgreSQLデータベースにユーザー情報を同期
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // ユーザーが存在するか確認
      const { rows } = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [user.id]
      )

      if (rows.length === 0) {
        // 新規ユーザーの場合、レコードを作成
        await client.query(
          `INSERT INTO users (id, email, username, created_at)
           VALUES ($1, $2, $3, $4)`,
          [user.id, user.email, profile.username, new Date()]
        )
      } else {
        // 既存ユーザーの場合、情報を更新
        await client.query(
          `UPDATE users 
           SET email = $1, username = $2, updated_at = $3
           WHERE id = $4`,
          [user.email, profile.username, new Date(), user.id]
        )
      }

      await client.query('COMMIT')
      return NextResponse.json({ message: 'User synchronized successfully' })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to sync user data' },
      { status: 500 }
    )
  }
} 