const imageUpload = document.getElementById('imageUpload');
const extractAll = document.getElementById('extractAll');
const extractPartial = document.getElementById('extractPartial');
const colorCount = document.getElementById('colorCount');
const extractBtn = document.getElementById('extractBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const colorContainer = document.getElementById('colorContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const fileName = document.getElementById('fileName');

let uploadedImage = null;

imageUpload.addEventListener('change', (e) => {
    uploadedImage = e.target.files[0];
    fileName.textContent = uploadedImage ? uploadedImage.name : '';
    extractBtn.disabled = false;
    resetBtn.disabled = false;
    updateExtractButtonState();
});

extractAll.addEventListener('change', () => {
    if (extractAll.checked) {
        extractPartial.checked = false;
        colorCount.disabled = true;
    }
    updateExtractButtonState();
});

extractPartial.addEventListener('change', () => {
    if (extractPartial.checked) {
        extractAll.checked = false;
        colorCount.disabled = false;
    } else {
        colorCount.disabled = true;
    }
    updateExtractButtonState();
});

extractBtn.addEventListener('click', () => {
    if (uploadedImage) {
        loadingIndicator.classList.remove('hidden');
        setTimeout(() => extractColors(), 0);
    }
});

downloadBtn.addEventListener('click', downloadColors);
resetBtn.addEventListener('click', resetColors);

function updateExtractButtonState() {
    extractBtn.disabled = !(uploadedImage && (extractAll.checked || extractPartial.checked));
}

function extractColors() {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxSize = 100; // Reduce image size for faster processing
            let width = img.width;
            let height = img.height;
            
            if (width > height && width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
            } else if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            const colorMap = new Map();

            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const hex = rgbToHex(r, g, b);
                colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
            }

            let sortedColors = [...colorMap.entries()].sort((a, b) => b[1] - a[1]);
            
            if (extractPartial.checked) {
                const count = parseInt(colorCount.value);
                sortedColors = sortedColors.slice(0, count);
            } else if (extractAll.checked) {
                sortedColors = sortedColors.slice(0, 256);
            }

            displayColors(sortedColors.map(([color]) => color));
            downloadBtn.disabled = false;
            loadingIndicator.classList.add('hidden');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(uploadedImage);
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function displayColors(colors) {
    colorContainer.innerHTML = '';
    colors.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = color;
        colorBox.textContent = color;
        colorContainer.appendChild(colorBox);
    });
}

function downloadColors() {
    const scale = 2; // Increase resolution
    const boxSize = 200 * scale;
    const padding = 20 * scale;
    const fontSize = 24 * scale;
    const cols = Math.ceil(Math.sqrt(colorContainer.children.length));
    const rows = Math.ceil(colorContainer.children.length / cols);

    const canvas = document.createElement('canvas');
    canvas.width = cols * (boxSize + padding) + padding;
    canvas.height = rows * (boxSize + padding) + padding;
    const ctx = canvas.getContext('2d');

    // Set transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    Array.from(colorContainer.children).forEach((colorBox, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = col * (boxSize + padding) + padding;
        const y = row * (boxSize + padding) + padding;

        // Draw color box
        ctx.fillStyle = colorBox.style.backgroundColor;
        ctx.fillRect(x, y, boxSize, boxSize);

        // Draw text with black outline
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2 * scale; // Updated line width
        ctx.strokeText(colorBox.textContent, x + boxSize / 2, y + boxSize / 2);
        ctx.fillStyle = getContrastColor(colorBox.style.backgroundColor);
        ctx.fillText(colorBox.textContent, x + boxSize / 2, y + boxSize / 2);
    });

    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'extracted_colors.png';
    link.href = dataURL;
    link.click();
}

function getContrastColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}

function resetColors() {
    colorContainer.innerHTML = '';
    downloadBtn.disabled = true;
    extractBtn.disabled = false;
    extractAll.checked = false;
    extractPartial.checked = false;
    colorCount.disabled = true;
    updateExtractButtonState();
}

