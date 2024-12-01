// DOM Elements
const imageUpload = document.getElementById("imageUpload");
const extractColorsButton = document.getElementById("extractColors");
const downloadPaletteButton = document.getElementById("downloadPalette");
const resetAppButton = document.getElementById("resetApp");
const allColorsOption = document.getElementById("allColors");
const partialColorsOption = document.getElementById("partialColors");
const colorCountInput = document.getElementById("colorCount");
const paletteSection = document.getElementById("paletteSection");
const info = document.getElementById("info");
const totalColorsText = document.getElementById("totalColors");

// Canvas
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
let extractedColors = [];
let totalColorsFound = [];

// Reset Functionality
function resetApp() {
  // Reset only the color-related parts, not the uploaded image
  paletteSection.innerHTML = "";
  extractedColors = [];
  allColorsOption.checked = true;
  partialColorsOption.checked = false;
  colorCountInput.disabled = true;
  info.textContent = "Upload an image to analyze its colors.";
  totalColorsText.style.display = "none";
  extractColorsButton.disabled = true;
  downloadPaletteButton.style.display = "none";
}

// Handle File Upload
imageUpload.addEventListener("change", () => {
  const file = imageUpload.files[0];
  if (file && file.type.startsWith("image/")) {
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      info.textContent = "Image uploaded successfully. Ready to extract colors.";

      // Display total colors found after image upload
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorSet = new Set();
      for (let i = 0; i < imageData.length; i += 4) {
        const color = rgbToHex(imageData[i], imageData[i + 1], imageData[i + 2]);
        colorSet.add(color);
      }
      totalColorsFound = Array.from(colorSet);
      totalColorsText.textContent = `${totalColorsFound.length} colors found in this image.`;
      totalColorsText.style.display = "block";

      extractColorsButton.disabled = false;
    };
    img.src = URL.createObjectURL(file);
  } else {
    info.textContent = "Please upload a valid image.";
  }
});

// Extract Colors
extractColorsButton.addEventListener("click", () => {
  extractedColors = allColorsOption.checked
    ? totalColorsFound
    : totalColorsFound.slice(0, parseInt(colorCountInput.value) || 5);

  displayColors(extractedColors);
  downloadPaletteButton.style.display = extractedColors.length > 0 ? "inline-block" : "none";
});

// RGB to HEX Conversion
function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Display Extracted Colors
function displayColors(colors) {
  paletteSection.innerHTML = colors
    .map(
      (color) => `
      <div class="palette">
        <div style="background-color: ${color};"></div>
        <span>${color}</span>
      </div>
    `
    )
    .join("");
}

// Download Palette
downloadPaletteButton.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const boxSize = 120; // Width and height of each color box
  const padding = 20; // Space between boxes
  const colorsPerRow = 5; // Maximum colors per row

  const rows = Math.ceil(extractedColors.length / colorsPerRow); // Calculate rows based on the number of colors

  // Set canvas size
  canvas.width = colorsPerRow * (boxSize + padding) + padding;
  canvas.height = rows * (boxSize + padding) + padding;

  // Draw each color box
  extractedColors.forEach((color, index) => {
    const x = (index % colorsPerRow) * (boxSize + padding) + padding;
    const y = Math.floor(index / colorsPerRow) * (boxSize + padding) + padding;

    // Draw color box
    ctx.fillStyle = color;
    ctx.fillRect(x, y, boxSize, boxSize);

    // Draw color code (text) at the center of the box
    ctx.fillStyle = "#000";
    ctx.font = "14px Poppins";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(color, x + boxSize / 2, y + boxSize / 2);
  });

  // Trigger download
  const link = document.createElement("a");
  link.download = "palette.png";
  link.href = canvas.toDataURL();
  link.click();
});


// Enable Partial Colors Input
partialColorsOption.addEventListener("change", () => {
  colorCountInput.disabled = !partialColorsOption.checked;
});

// Reset Event
resetAppButton.addEventListener("click", resetApp);
