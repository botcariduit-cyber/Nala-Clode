import type { SprayingRecord } from "./types";

export function exportSprayingCSV(records: SprayingRecord[]) {
  const headers = ["Tanggal", "Nama Produk", "Jenis", "Dosis", "Luas Area", "Biaya", "Operator", "Catatan"];
  const rows = records.map(r => [
    r.tanggal, r.nama_produk, r.jenis_produk || "", r.dosis || "",
    String(r.luas_area || ""), String(r.biaya || ""), r.operator || "", r.catatan || "",
  ]);
  const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadFile(csv, "riwayat-penyemprotan.csv", "text/csv;charset=utf-8;");
}

export function exportSprayingExcel(records: SprayingRecord[]) {
  const headers = ["Tanggal", "Nama Produk", "Jenis", "Dosis", "Luas Area (ha)", "Biaya (Rp)", "Operator", "Catatan"];
  const rows = records.map(r => [
    r.tanggal, r.nama_produk, r.jenis_produk || "", r.dosis || "",
    r.luas_area ?? "", r.biaya ?? "", r.operator || "", r.catatan || "",
  ]);
  const table = [headers, ...rows].map(row => `<tr>${row.map(c => `<td>${c}</td>`).join("")}</tr>`).join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"></head><body><table>${table}</table></body></html>`;
  downloadFile(html, "riwayat-penyemprotan.xls", "application/vnd.ms-excel");
}

export function exportSprayingPDF(records: SprayingRecord[]) {
  const rows = records.map(r =>
    `<tr><td>${r.tanggal}</td><td>${r.nama_produk}</td><td>${r.jenis_produk || "-"}</td><td>${r.dosis || "-"}</td><td>${r.luas_area ?? "-"}</td><td>${r.biaya ?? 0}</td><td>${r.operator || "-"}</td></tr>`
  ).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Riwayat Penyemprotan</title>
<style>body{font-family:sans-serif;padding:24px;color:#111}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ccc;padding:8px;font-size:12px;text-align:left}th{background:#f3f4f6}</style></head>
<body><h1>Riwayat Penyemprotan — Gercep AI</h1><p>Dicetak: ${new Date().toLocaleString("id-ID")}</p>
<table><thead><tr><th>Tanggal</th><th>Produk</th><th>Jenis</th><th>Dosis</th><th>Luas</th><th>Biaya</th><th>Operator</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.print();
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
