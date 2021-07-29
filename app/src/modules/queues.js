import Queue from 'bull';
import {execFile} from 'mz/child_process';

import {CONFIG, knex} from '../common';

export const blurredQueue = new Queue('unlockable media blurring', {
  redis: {
    port: CONFIG.redis.port,
    host: CONFIG.redis.host,
    password: CONFIG.redis.password
  },
  defaultJobOptions: {
    timeout: 30000,
    removeOnComplete: true,
    removeOnFail: true
  }
});

blurredQueue.process(async (job) => {
  const {srcPath, dstPath, articleID} = job.data;
  try {
    const [result] = await execFile('mediainfo', ['--output=JSON', srcPath]);
    const media = JSON.parse(result).media;
    const mediaTrack = media.track[1];
    const isGIF = mediaTrack.Format === 'GIF';
    // save WxH + video duration to db
    if (mediaTrack['@type'] === 'Image' && !isGIF) {
      const info = {media_hidden: {width: parseInt(mediaTrack.Width, 10), height: parseInt(mediaTrack.Height, 10)}};

      // const minEdge = Math.min(parseInt(track.Width, 10), parseInt(track.Height, 10));
      // let radius = Math.floor(minEdge / 8);
      // if (radius < 1) radius = 1;
      // const args = ['convert', srcPath, '-blur', `${radius}x30`, '-quality', '95', `jpg:${dstPath}`];
      const args = ['convert', srcPath, '-resize', '32x32', '-quality', '95', '-flatten', `jpg:${dstPath}`];
      console.log(`[blurredQueue] calling gm with args "${args.join(' ')}"`);
      await execFile('gm', args);
      await knex('article').update({
        blurred_media_mime_type: 'image/jpeg',
        details: knex.raw('details || ?', [JSON.stringify(info)])
      }).where('article_id', articleID);
      console.log(`[blurredQueue] done ${srcPath} => ${dstPath}`);
      return;
    }
    if (mediaTrack['@type'] === 'Video' || isGIF) {
      const [w, h] = [parseInt(mediaTrack.Width, 10), parseInt(mediaTrack.Height, 10)];
      const info = {media_hidden: {width: w, height: h, duration: isGIF ? undefined : parseFloat(media.track[0].Duration)}};
      const maxEdge = Math.max(w, h);
      // const vf = maxEdge === w ? 'scale=1280:-2,boxblur=30' : 'scale=-2:1280,boxblur=30';
      // const args = ['-i', srcPath, '-t', '10', '-crf', '28', '-an', '-f', 'mp4', '-vf', vf, dstPath];
      // const vf = maxEdge === w ? 'scale=32:-1' : 'scale=-1:32';
      // const args = ['-i', srcPath, '-t', '10', '-f', 'gif', '-vf', vf, dstPath];
      const vf = maxEdge === w ? 'scale=32:-2' : 'scale=-2:32';
      const args = ['-i', srcPath, '-t', '10', '-crf', '28', '-an', '-f', 'mp4', '-pix_fmt', 'yuv420p', '-vf', vf, dstPath];
      console.log(`[blurredQueue] calling ffmpeg with args "${args.join(' ')}"`);
      await execFile('ffmpeg', args);
      await knex('article').update({
        // blurred_media_mime_type: 'image/gif'
        blurred_media_mime_type: 'video/mp4',
        details: knex.raw('details || ?', [JSON.stringify(info)])
      }).where('article_id', articleID);
      console.log(`[blurredQueue] done ${srcPath} => ${dstPath}`);
      return;
    }
    throw new Error(`Unsupported media track type ${mediaTrack['@type']}`);
  } catch (error) {
    console.error(error);
    throw error;
  }
});


export const previewQueue = new Queue('media preview generating', {
  redis: {
    port: CONFIG.redis.port,
    host: CONFIG.redis.host,
    password: CONFIG.redis.password
  },
  defaultJobOptions: {
    timeout: 60000,
    removeOnComplete: true,
    removeOnFail: true
  }
});

previewQueue.process(async (job) => {
  const {srcPath, dstPath, articleID} = job.data;
  try {
    const [result] = await execFile('mediainfo', ['--output=JSON', srcPath]);
    const media = JSON.parse(result).media;
    const track = media.track[1];

    const isGIF = track.Format === 'GIF';
    // save WxH to db
    if (track['@type'] === 'Image' && !isGIF) {
      const args = ['convert', srcPath, '-resize', '800x800', '-quality', '90', '-flatten', `jpg:${dstPath}`];
      console.log(`[previewQueue] calling gm with args "${args.join(' ')}"`);
      await execFile('gm', args);

      const info = {media_public: {width: parseInt(track.Width, 10), height: parseInt(track.Height, 10)}};
      await knex('article').update({
        details: knex.raw('details || ?', [JSON.stringify(info)])
      }).where('article_id', articleID);

      console.log(`[previewQueue] done ${srcPath} => ${dstPath}`);
      return;
    }
    if (track['@type'] === 'Video' || isGIF) {
      const [w, h] = [parseInt(track.Width, 10), parseInt(track.Height, 10)];
      const maxEdge = Math.max(w, h);
      const targetEdge = Math.min(Math.round(maxEdge / 2) * 2, 640);
      const vf = maxEdge === w ? `scale=${targetEdge}:-2` : `scale=-2:${targetEdge}`;
      const args = ['-i', srcPath, '-t', '10', '-crf', '28', '-an', '-f', 'mp4', '-pix_fmt', 'yuv420p', '-vf', vf, dstPath];
      console.log(`[previewQueue] calling ffmpeg with args "${args.join(' ')}"`);
      await execFile('ffmpeg', args);

      const info = {media_public: {width: w, height: h, duration: isGIF ? undefined : parseFloat(media.track[0].Duration)}};
      await knex('article').update({
        details: knex.raw('details || ?', [JSON.stringify(info)])
      }).where('article_id', articleID);

      console.log(`[previewQueue] done ${srcPath} => ${dstPath}`);
      return;
    }
    throw new Error(`Unsupported track type ${track['@type']}`);
  } catch (error) {
    console.error(error);
    throw error;
  }
});


export const heifQueue = new Queue('heif to jpg', {
  redis: {
    port: CONFIG.redis.port,
    host: CONFIG.redis.host,
    password: CONFIG.redis.password
  },
  defaultJobOptions: {
    timeout: 10000,
    removeOnComplete: true,
    removeOnFail: true
  }
});

heifQueue.process(async (job) => {
  const {srcPath, dstPath} = job.data;
  const args = [srcPath, '-quality', '95', `jpg:${dstPath}`];
  console.log(`[heifQueue] calling convert with args "${args.join(' ')}"`);
  await execFile('convert', args);
  console.log(`[heifQueue] done ${srcPath} => ${dstPath}`);
});
