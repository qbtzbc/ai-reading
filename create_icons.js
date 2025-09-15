// 创建纯色图标的Node.js脚本
const fs = require('fs');
const { createCanvas } = require('canvas');

function createSimpleIcon(size, color = '#4CAF50') {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 清除画布
    ctx.clearRect(0, 0, size, size);
    
    // 绘制圆形背景
    const margin = Math.floor(size / 8);
    const radius = (size - margin * 2) / 2;
    const centerX = size / 2;
    const centerY = size / 2;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    // 绘制书本图标
    if (size >= 32) {
        const bookWidth = Math.floor(size / 2);
        const bookHeight = Math.floor(size / 3);
        const bookX = (size - bookWidth) / 2;
        const bookY = (size - bookHeight) / 2;
        
        // 书本背景
        ctx.fillStyle = 'white';
        ctx.fillRect(bookX, bookY, bookWidth, bookHeight);
        
        // 书页线条
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        const lineSpacing = bookHeight / 5;
        for (let i = 1; i < 4; i++) {
            const y = bookY + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(bookX + 2, y);
            ctx.lineTo(bookX + bookWidth - 2, y);
            ctx.stroke();
        }
    } else {
        // 小尺寸图标简化为点
        const dotSize = size / 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, dotSize / 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
    }
    
    return canvas;
}

// 创建各种尺寸的图标
const sizes = [16, 32, 48, 128];
for (const size of sizes) {
    try {
        const canvas = createSimpleIcon(size);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(`icons/icon${size}.png`, buffer);
        console.log(`Created icon${size}.png (${buffer.length} bytes)`);
    } catch (error) {
        console.error(`Failed to create icon${size}.png:`, error.message);
    }
}

console.log('Icon creation completed!');