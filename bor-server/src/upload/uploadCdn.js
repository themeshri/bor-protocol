import * as https from 'https';

const BUNNY_STORAGE_HOST = process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
const BUNNY_STORAGE_PATH = process.env.BUNNY_STORAGE_PATH || '/borstorage/speech';
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || 'https://borstorage.b-cdn.net/speech';

export const uploadAudioToBunnyCDN = async (audioBuffer) => {
  const timestamp = Date.now();
  const fileName = `${timestamp}.mp3`;

  try {
    const options = {
      method: 'PUT',
      host: BUNNY_STORAGE_HOST,
      path: `${BUNNY_STORAGE_PATH}/${fileName}`,
      headers: {
        'AccessKey': process.env.BUNNY_STORAGE_API_KEY || '',
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
      },
    };

    const publicUrl = await new Promise((resolve, reject) => {
      const uploadReq = https.request(options, (uploadRes) => {
        const isSuccess = [200, 201].includes(uploadRes.statusCode || 0);
        if (isSuccess) {
          const publicUrl = `${BUNNY_CDN_URL}/${fileName}`;
          console.log("BunnyCDN upload successful", { publicUrl });
          resolve(publicUrl);
        } else {
          let data = '';
          uploadRes.on('data', chunk => data += chunk);
          uploadRes.on('end', () => {
            reject(new Error(`Upload failed with status ${uploadRes.statusCode}: ${data}`));
          });
        }
      });

      uploadReq.on('error', (error) => reject(error));

      uploadReq.write(audioBuffer);
      uploadReq.end();
    });

    return publicUrl;
  } catch (error) {
    throw new Error("Audio upload failed");
  }
};

