import sharp from 'sharp';
import { optimizeVehiclePhoto } from '../src/utils/images';

describe('optimizeVehiclePhoto', () => {
  it('convierte a WebP, redimensiona y genera thumbnail', async () => {
    const input = await sharp({
      create: {
        width: 3000,
        height: 2000,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await optimizeVehiclePhoto(input);

    expect(result.webp.length).toBeGreaterThan(0);
    expect(result.thumb.length).toBeGreaterThan(0);
    expect(result.width).toBeLessThanOrEqual(1920);
    expect(result.height).toBeLessThanOrEqual(1920);

    const meta = await sharp(result.webp).metadata();
    expect(meta.format).toBe('webp');
  });

  it('rechaza un archivo que no es imagen', async () => {
    await expect(optimizeVehiclePhoto(Buffer.from('no soy una imagen'))).rejects.toThrow();
  });
});
