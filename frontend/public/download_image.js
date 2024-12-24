import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Using a free illustration from Unsplash
const imageUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';
const outputPath = new URL('./hero-image.png', import.meta.url);

https.get(imageUrl, (response) => {
  const fileStream = fs.createWriteStream(fileURLToPath(outputPath));
  response.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log('Image downloaded successfully!');
  });
}).on('error', (err) => {
  console.error('Error downloading image:', err.message);
});
