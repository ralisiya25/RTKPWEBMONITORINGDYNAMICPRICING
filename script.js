
let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let cameraStream = null;
let threshold = 30;

// Warna referensi dan kualitas/harga
const colorData = [
  {hex: "#421a25", rgb: [66,26,37], kualitas: "Sangat Layak", harga: "Rp 20.000"},
  {hex: "#5F1B12", rgb: [95,27,18], kualitas: "Layak", harga: "Rp 18.000"},
  {hex: "#6B280E", rgb: [107,40,14], kualitas: "Layak", harga: "Rp 17.000"},
  {hex: "#7D3215", rgb: [125,50,21], kualitas: "Cukup Layak", harga: "Rp 15.000"},
  {hex: "#481F22", rgb: [72,31,34], kualitas: "Tidak Layak", harga: "Rp 12.000"},
  {hex: "#441518", rgb: [68,21,24], kualitas: "Tidak Layak", harga: "Rp 10.000"},
  {hex: "#560D14", rgb: [86,13,20], kualitas: "Tidak Layak", harga: "Rp 8.000"}
];

// Tampilkan daftar kamera
async function loadCameras() {
  let devices = await navigator.mediaDevices.enumerateDevices();
  let videoDevices = devices.filter(d => d.kind === 'videoinput');
  let select = document.getElementById('cameraSelect');
  select.innerHTML = '';
  videoDevices.forEach((device, index) => {
    let option = document.createElement('option');
    let label = device.label || `Kamera ${index+1}`;
    if (label.toLowerCase().includes("back")) {
      option.text = `📱 Kamera Belakang - ${label}`;
    } else if (label.toLowerCase().includes("front")) {
      option.text = `🤳 Kamera Depan - ${label}`;
    } else {
      option.text = `🎥 ${label}`;
    }
    option.value = device.deviceId;
    select.appendChild(option);
  });
}

async function startCamera() {
  stopCamera();
  let deviceId = document.getElementById('cameraSelect').value;
  cameraStream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: deviceId ? { exact: deviceId } : undefined }
  });
  video.srcObject = cameraStream;
}

function stopCamera() {
  if (cameraStream) {
    let tracks = cameraStream.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }
}

function rgbDistance(c1, c2) {
  return Math.sqrt(
    Math.pow(c1[0]-c2[0],2) +
    Math.pow(c1[1]-c2[1],2) +
    Math.pow(c1[2]-c2[2],2)
  );
}

function scanColor() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  let imageData = context.getImageData(canvas.width/2, canvas.height/2, 1, 1).data;
  let rgb = [imageData[0], imageData[1], imageData[2]];
  let hex = rgbToHex(rgb[0], rgb[1], rgb[2]);

  let bestMatch = null;
  let minDist = Infinity;
  colorData.forEach(c => {
    let dist = rgbDistance(rgb, c.rgb);
    if (dist < minDist) {
      minDist = dist;
      bestMatch = c;
    }
  });

  if (minDist <= threshold) {
    addResult(hex, bestMatch.kualitas, bestMatch.harga);
  } else {
    addResult(hex, "Tidak Dikenali", "-");
  }
}

function simulateColor() {
  let hex = document.getElementById('manualColor').value;
  let rgb = hexToRgb(hex);
  let bestMatch = null;
  let minDist = Infinity;
  colorData.forEach(c => {
    let dist = rgbDistance(rgb, c.rgb);
    if (dist < minDist) {
      minDist = dist;
      bestMatch = c;
    }
  });

  if (minDist <= threshold) {
    addResult(hex, bestMatch.kualitas, bestMatch.harga);
  } else {
    addResult(hex, "Tidak Dikenali", "-");
  }
}

function rgbToHex(r,g,b) {
  return "#" + [r,g,b].map(x => {
    const hex = x.toString(16).padStart(2,'0');
    return hex;
  }).join('');
}

function hexToRgb(hex) {
  let bigint = parseInt(hex.slice(1), 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  return [r,g,b];
}

function addResult(hex, kualitas, harga) {
  let table = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
  let row = table.insertRow();
  let waktu = new Date().toLocaleString();
  row.insertCell(0).innerText = waktu;
  row.insertCell(1).innerText = hex;
  row.insertCell(2).innerText = kualitas;
  row.insertCell(3).innerText = harga;

  // Simpan ke localStorage
  let results = JSON.parse(localStorage.getItem("scanResults") || "[]");
  results.push({ waktu, hex, kualitas, harga });
  localStorage.setItem("scanResults", JSON.stringify(results));
}

function updateThreshold() {
  threshold = document.getElementById('threshold').value;
  document.getElementById('thresholdValue').innerText = threshold;
}

function exportCSV() {
  let results = JSON.parse(localStorage.getItem("scanResults") || "[]");
  if (results.length === 0) {
    alert("Belum ada data untuk diekspor!");
    return;
  }
  let csv = "Waktu,Warna HEX,Kualitas,Harga\n";
  results.forEach(r => {
    csv += `${r.waktu},${r.hex},${r.kualitas},${r.harga}\n`;
  });
  let blob = new Blob([csv], { type: 'text/csv' });
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.setAttribute('hidden','');
  a.setAttribute('href',url);
  a.setAttribute('download','scan_results.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Load data dari localStorage saat halaman dibuka
window.onload = () => {
  loadCameras();
  let results = JSON.parse(localStorage.getItem("scanResults") || "[]");
  results.forEach(r => {
    let table = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
    let row = table.insertRow();
    row.insertCell(0).innerText = r.waktu;
    row.insertCell(1).innerText = r.hex;
    row.insertCell(2).innerText = r.kualitas;
    row.insertCell(3).innerText = r.harga;
  });
};
