"use client";

import React, { useState } from "react";
import SliderControl from "../SliderControl";
import { ChromePicker, ColorResult } from "react-color";

interface BackgroundTabProps {
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  borderUpdate: (value: number) => void;
  borderColorUpdate: (value: ColorResult) => void;
  backgroundColorUpdate: (value: ColorResult) => void;
  borderWidthLive?: (value: number) => void;
  hideBorder?: boolean;
}

const BackgroundTab = ({
  borderColor,
  borderWidth,
  backgroundColor,
  borderUpdate,
  borderColorUpdate,
  backgroundColorUpdate,
  borderWidthLive,
  hideBorder = false,
}: BackgroundTabProps) => {
  const [displayBorderColorPicker, setDisplayBorderColorPicker] =
    useState(false);
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  return (
    <div>
      {!hideBorder && (
        <div className=" flex flex-row gap-2 items-center w-full">
          <div
            className=" border border-gray-300 dark:border-gray-600 rounded-sm cursor-pointer w-8 h-7 flex justify-center items-center p-1"
            onClick={() => setDisplayBorderColorPicker(!displayBorderColorPicker)}
          >
            <div
              className="w-full h-full rounded"
              style={{ backgroundColor: borderColor }}
            />
          </div>

          <div className="flex-1">
            <SliderControl
              label="Borde"
              value={borderWidth}
              min={0}
              max={50}
              step={1}
              onCommit={borderUpdate}
              onLiveChange={borderWidthLive}
            />
          </div>

          {displayBorderColorPicker ? (
            <div className=" absolute z-10 mt-2">
              <div
                className="fixed inset-0"
                onClick={() => setDisplayBorderColorPicker(false)}
              />
              <ChromePicker
                disableAlpha
                color={borderColor}
                onChangeComplete={borderColorUpdate}
              />
            </div>
          ) : null}
        </div>
      )}

      <div className="relative">
        <label className="text-xs">Color de fondo</label>
        <div
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
          onClick={() => setDisplayColorPicker(!displayColorPicker)}
        >
          <div
            className="w-full h-8 rounded"
            style={{ backgroundColor: backgroundColor }}
          />
        </div>
        {displayColorPicker ? (
          <div className="absolute z-10 mt-2">
            <div
              className="fixed inset-0"
              onClick={() => setDisplayColorPicker(false)}
            />
            <ChromePicker
              disableAlpha
              color={backgroundColor}
              onChangeComplete={backgroundColorUpdate}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default BackgroundTab;
