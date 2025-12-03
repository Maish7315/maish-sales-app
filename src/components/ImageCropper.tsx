import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RotateCw, Maximize2, Minimize2 } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  maxSizeMB?: number;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageFile,
  onCropComplete,
  onCancel,
  maxSizeMB = 5
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [imageScale, setImageScale] = useState([100]);
  const [rotation, setRotation] = useState(0);

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const getCroppedImg = async (
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const scale = imageScale[0] / 100;

    // Calculate final dimensions
    const finalWidth = crop.width * scale;
    const finalHeight = crop.height * scale;

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    // Apply transformations
    ctx.save();
    
    // Apply rotation if needed
    if (rotation !== 0) {
      ctx.translate(finalWidth / 2, finalHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-finalWidth / 2, -finalHeight / 2);
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      finalWidth,
      finalHeight
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Canvas is empty');
        resolve(blob);
      }, 'image/jpeg', 0.9); // Higher quality
    });
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      const croppedFile = new File([croppedBlob], imageFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Check if the cropped image is still too large
      if (croppedFile.size > maxSizeMB * 1024 * 1024) {
        alert(`Image is still too large (${(croppedFile.size / 1024 / 1024).toFixed(1)}MB). Please crop more aggressively or choose a smaller image.`);
        setLoading(false);
        return;
      }

      onCropComplete(croppedFile);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error cropping image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Crop Image</h2>
          <p className="text-sm text-muted-foreground">
            Crop the image to reduce file size. Final image must be under {maxSizeMB}MB.
          </p>
        </div>

        <div className="space-y-6">
          {/* Image Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Image Scale</Label>
              <div className="flex items-center gap-2">
                <Minimize2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={imageScale}
                  onValueChange={setImageScale}
                  min={25}
                  max={200}
                  step={5}
                  className="flex-1"
                />
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{imageScale[0]}%</p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Rotation</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation(prev => prev - 90)}
                  disabled={loading}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {rotation}°
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation(prev => prev + 90)}
                  disabled={loading}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Crop Area */}
          {imageSrc && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <ReactCrop
                crop={crop}
                onChange={setCrop}
                onComplete={setCompletedCrop}
                aspect={undefined}
                minWidth={200}
                minHeight={200}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className="max-w-full max-h-96 object-contain mx-auto"
                  style={{ 
                    maxHeight: '500px',
                    transform: `scale(${imageScale[0] / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease'
                  }}
                />
              </ReactCrop>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={!completedCrop || loading}
              className="bg-gradient-primary hover:opacity-90"
            >
              {loading ? 'Processing...' : 'Apply Crop & Resize'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};