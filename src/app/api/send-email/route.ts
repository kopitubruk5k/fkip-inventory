import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentName, studentEmail, studentNim, items, startDate, endDate, purpose } = body

    // Validate env vars
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD
    const adminEmail = process.env.ADMIN_EMAIL

    if (!gmailUser || !gmailPass || !adminEmail) {
      return NextResponse.json({ error: 'Email credentials not configured' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    })

    // Format items list
    const itemRows = (items as { name: string; qty: number }[])
      .map((i, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #475569;">${idx + 1}</td>
          <td style="padding: 10px 16px; font-weight: 600; color: #0f172a;">${i.name}</td>
          <td style="padding: 10px 16px; text-align: center; color: #5b4fe8; font-weight: 700;">${i.qty} unit</td>
        </tr>`)
      .join('')

    const approveUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/admin/peminjaman`

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background:#f8fafc;">
  <div style="max-width: 580px; margin: 32px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 28px 32px;">
      <div style="color: white; font-size: 13px; opacity: 0.8; margin-bottom: 6px;">FKIP UMS — Sistem Inventaris</div>
      <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">📋 Pengajuan Peminjaman Baru</h1>
    </div>

    <!-- Body -->
    <div style="padding: 28px 32px;">
      <p style="color: #475569; font-size: 15px; margin: 0 0 20px;">
        Ada permintaan peminjaman alat baru yang memerlukan persetujuan Anda.
      </p>

      <!-- Student Info -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; border-left: 4px solid #5b4fe8;">
        <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Data Peminjam</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; font-size: 13px; padding: 4px 0; width: 130px;">Nama</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 13px; padding: 4px 0;">: ${studentName}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 13px; padding: 4px 0;">Email</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 13px; padding: 4px 0;">: ${studentEmail}</td>
          </tr>
          ${studentNim ? `<tr>
            <td style="color: #64748b; font-size: 13px; padding: 4px 0;">NIM</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 13px; padding: 4px 0;">: ${studentNim}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- Items table -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Daftar Alat yang Dipinjam</div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 10px 16px; text-align: left; font-size: 12px; color: #94a3b8; font-weight: 700;">No</th>
              <th style="padding: 10px 16px; text-align: left; font-size: 12px; color: #94a3b8; font-weight: 700;">Nama Alat</th>
              <th style="padding: 10px 16px; text-align: center; font-size: 12px; color: #94a3b8; font-weight: 700;">Jumlah</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>

      <!-- Dates -->
      <div style="display: flex; gap: 12px; margin-bottom: 20px;">
        <div style="flex: 1; background: #f0fdf4; border-radius: 10px; padding: 14px 16px; border: 1px solid #bbf7d0;">
          <div style="font-size: 11px; color: #16a34a; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">📅 Tanggal Pinjam</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${new Date(startDate).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
        <div style="flex: 1; background: #fff7ed; border-radius: 10px; padding: 14px 16px; border: 1px solid #fed7aa;">
          <div style="font-size: 11px; color: #b45309; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">📅 Tanggal Kembali</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${new Date(endDate).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <!-- Purpose -->
      <div style="background: #eff6ff; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; border: 1px solid #bfdbfe;">
        <div style="font-size: 11px; color: #1d4ed8; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">💬 Keperluan / Tujuan</div>
        <div style="font-size: 14px; color: #1e293b; line-height: 1.6;">${purpose}</div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${approveUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(79,70,229,0.3);">
          ✅ Kelola Peminjaman di Dashboard
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
      <div style="font-size: 12px; color: #94a3b8;">FKIP UMS Inventory System • Email ini dikirim otomatis, jangan balas langsung.</div>
    </div>
  </div>
</body>
</html>`

    await transporter.sendMail({
      from: `"FKIP UMS Inventory" <${gmailUser}>`,
      to: adminEmail,
      subject: `🔔 Peminjaman Baru: ${studentName} mengajukan ${items.length} alat`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
