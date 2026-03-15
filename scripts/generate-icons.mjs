    import sharp from 'sharp'

const sizes = [512]
const src = './public/assets/logos/general_logo_primary.png'

for (const size of sizes) {
  await sharp(src)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 245, g: 240, b: 232, alpha: 1 } // your #F5F0E8
    })
    .toFile(`./public/assets/icon-${size}x${size}.png`)
  
  console.log(`Generated ${size}x${size}`)
}