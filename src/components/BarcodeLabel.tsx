import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import type { Product } from "@/lib/types";
import { formatBRL } from "@/lib/storage";

interface Props {
  product: Product;
}

export function BarcodeLabel({ product }: Props) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, product.barcode, {
          format: "EAN13",
          displayValue: true,
          fontSize: 12,
          height: 40,
          margin: 0,
        });
      } catch (e) {
        console.error("Erro código de barras", e);
      }
    }
    if (qrRef.current) {
      QRCode.toCanvas(qrRef.current, product.barcode, {
        width: 80,
        margin: 0,
      });
    }
  }, [product.barcode]);

  return (
    <div className="border border-border rounded-lg p-3 bg-card flex flex-col items-center gap-2 print:break-inside-avoid">
      <div className="text-xs font-semibold text-center line-clamp-2 w-full">{product.name}</div>
      <div className="text-[10px] text-muted-foreground">{product.sku}</div>
      <div className="flex items-center gap-3 w-full justify-center">
        <svg ref={barcodeRef} />
        <canvas ref={qrRef} />
      </div>
      <div className="text-sm font-bold text-primary">{formatBRL(product.salePrice)}</div>
    </div>
  );
}