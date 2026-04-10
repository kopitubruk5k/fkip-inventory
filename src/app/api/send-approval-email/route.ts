import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Kontak Kepala TU — ubah sesuai data asli
const TU_HEAD_NAME = 'Kepala Tata Usaha FKIP UMS'
const TU_HEAD_PHONE = '0822-2586-0179'
const TU_HEAD_WA = '6822258601 79'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { status, studentEmail, studentName, itemName, quantity, startDate, endDate, adminNote } = body

    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD

    if (!gmailUser || !gmailPass || !studentEmail) {
      return NextResponse.json({ error: 'Missing config or email' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    })

    const isApproved = status === 'approved'

    const startFormatted = new Date(startDate).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    const endFormatted = new Date(endDate).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background:#f8fafc;">
  <div style="max-width: 580px; margin: 32px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${isApproved ? '#16a34a, #15803d' : '#dc2626, #b91c1c'}); padding: 28px 32px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">${isApproved ? '✅' : '❌'}</div>
      <div style="color: rgba(255,255,255,0.85); font-size: 13px; margin-bottom: 6px;">FKIP UMS — Sistem Inventaris</div>
      <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">
        ${isApproved ? 'Peminjaman Disetujui!' : 'Peminjaman Ditolak'}
      </h1>
    </div>

    <!-- Body -->
    <div style="padding: 28px 32px;">
      <p style="color: #475569; font-size: 15px; margin: 0 0 20px; line-height: 1.7;">
        Halo <strong>${studentName}</strong>,<br>
        ${isApproved
          ? 'Pengajuan peminjaman alat Anda telah <strong style="color:#16a34a;">disetujui</strong> oleh admin.'
          : 'Mohon maaf, pengajuan peminjaman alat Anda <strong style="color:#dc2626;">tidak dapat disetujui</strong> saat ini.'}
      </p>

      <!-- Item detail -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; border-left: 4px solid ${isApproved ? '#16a34a' : '#dc2626'};">
        <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Detail Peminjaman</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; font-size: 13px; padding: 5px 0; width: 140px;">Nama Alat</td>
            <td style="color: #0f172a; font-weight: 700; font-size: 14px; padding: 5px 0;">: ${itemName}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 13px; padding: 5px 0;">Jumlah</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 13px; padding: 5px 0;">: ${quantity} unit</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 13px; padding: 5px 0;">Tanggal Pinjam</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 13px; padding: 5px 0;">: ${startFormatted}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 13px; padding: 5px 0;">Tanggal Kembali</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 13px; padding: 5px 0;">: ${endFormatted}</td>
          </tr>
        </table>
      </div>

      ${adminNote ? `
      <!-- Admin note -->
      <div style="background: #fffbeb; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; border: 1px solid #fde68a;">
        <div style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; margin-bottom: 6px;">📝 Catatan dari Admin</div>
        <div style="font-size: 14px; color: #1e293b; line-height: 1.6;">${adminNote}</div>
      </div>` : ''}

      ${isApproved ? `
      <!-- Next steps -->
      <div style="background: #f0fdf4; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
        <div style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px;">📋 Langkah Selanjutnya</div>
        <ol style="margin: 0; padding-left: 18px; color: #374151; font-size: 13px; line-height: 2;">
          <li>Hubungi <strong>Kepala TU FKIP UMS</strong> untuk proses pengambilan alat</li>
          <li>Tunjukkan email konfirmasi ini saat pengambilan</li>
          <li>Bawa <strong>KTM</strong> sebagai jaminan</li>
          <li>Kembalikan alat tepat waktu sesuai tanggal yang telah ditentukan</li>
        </ol>
      </div>

      <!-- TU Contact -->
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 14px; padding: 20px 24px; margin-bottom: 24px; text-align: center;">
        <div style="color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">📞 Hubungi Kepala TU</div>
        <div style="color: white; font-size: 18px; font-weight: 800; margin-bottom: 4px;">${TU_HEAD_NAME}</div>
        <div style="color: rgba(255,255,255,0.95); font-size: 20px; font-weight: 800; letter-spacing: 0.05em;">${TU_HEAD_PHONE}</div>
        <a href="https://wa.me/${TU_HEAD_WA}" style="display: inline-block; margin-top: 12px; background: #25d366; color: white; text-decoration: none; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 700;">
          💬 Chat via WhatsApp
        </a>
      </div>` : `
      <!-- Rejected message -->
      <div style="background: #fef2f2; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; border: 1px solid #fecaca;">
        <div style="font-size: 13px; color: #7f1d1d; line-height: 1.7;">
          Jika Anda memiliki pertanyaan mengenai penolakan ini, silakan hubungi admin laboratorium atau coba ajukan peminjaman kembali dengan detail yang sesuai.
        </div>
      </div>`}
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
      <div style="font-size: 12px; color: #94a3b8;">FKIP UMS Inventory System • Email ini dikirim otomatis, jangan balas langsung.</div>
      <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">Laboratorium PTI — Universitas Muhammadiyah Surakarta</div>
    </div>
  </div>
</body>
</html>`

    await transporter.sendMail({
      from: `"FKIP UMS Inventory" <${gmailUser}>`,
      to: studentEmail,
      subject: isApproved
        ? `✅ Peminjaman Disetujui: ${itemName} — Hubungi Kepala TU untuk Pengambilan`
        : `❌ Peminjaman ${itemName} Tidak Disetujui`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Approval email error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
