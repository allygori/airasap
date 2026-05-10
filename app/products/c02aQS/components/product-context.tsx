"use client";

import React, { createContext, useContext, useState } from "react";
import { variant } from "../lib/constants";

export type TVariantSelection = {
  key: string;
  value: string;
};

type ProductContextType = {
  selectedVariants: TVariantSelection[];
  setSelectedVariant: (key: string, value: string) => void;
};

const ProductContext = createContext<ProductContextType | null>(null);

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedVariants, setSelectedVariants] = useState<TVariantSelection[]>(() => {
    const initialState: TVariantSelection[] = [];
    
    if (variant.colors?.length > 0) {
      initialState.push({ key: "Warna", value: variant.colors[0].value });
    }
    
    if (variant.sizes?.length > 0) {
      const middleIndex = Math.floor(variant.sizes.length / 2) - 1;
      initialState.push({ key: "Ukuran", value: variant.sizes[Math.max(0, middleIndex)].value });
    }
    
    return initialState;
  });

  const setSelectedVariant = (key: string, value: string) => {
    setSelectedVariants((prev) => {
      const existingIndex = prev.findIndex(v => v.key === key);
      if (existingIndex >= 0) {
        const newArr = [...prev];
        newArr[existingIndex] = { key, value };
        return newArr;
      }
      return [...prev, { key, value }];
    });
  };

  return (
    <ProductContext.Provider value={{ selectedVariants, setSelectedVariant }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProductContext must be used within ProductProvider");
  }
  return context;
};
