#!/usr/bin/env python
# Random PNG generator
__copyright__ = "Copyright (C) 2016-2019 Victor Zheng"
__licence__ = "GNU GPL v3"

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

# Settings

OUTPUT_FILE = "r.png" # Do I really need to explain this?
BLOCK_W, BLOCK_H = 8, 8 # block size [pixels]
IMAGE_W, IMAGE_H = 240, 135 # image size [blocks]
DEPTH = 24
# Color depth [bytes/pixel]
#   1 Black and White
#   8 Grayscale
#  24 RGB
#  32 RGBA

# Script
from os import urandom
import struct
import zlib

def B(x):
    return struct.pack(">B", x & 0xFF)

def I4(x):
    return struct.pack(">I", x & 0xFFFFFFFF)

zero16KiB = b"\0" * 16384

class CompressedPixelWriter:
    compressor = zlib.compressobj(9) # max compression
    out = lambda: None
    length = 0
    crc32 = 0x35AF061E # crc32("IDAT")

    def __init__(self, out):
        self.out = out

    def writeRaw(self, b):
        self.out(b)
        self.length += len(b)
        self.crc32 = zlib.crc32(b, self.crc32)

    def write(self, b):
        self.writeRaw(self.compressor.compress(b))

    def writez(self, num):
        # write in blocks of 16 KiB
        for i in range(num >> 14):
            self.writeRaw(self.compressor.compress(zero16KiB))
        num &= 0x3FFF
        self.writeRaw(self.compressor.compress(zero16KiB[:num]))

    def writePixels(self):
        # Empty image data
        pass

    def finalize(self):
        self.writePixels()
        self.writeRaw(self.compressor.flush())

def rPNG():
    global BLOCK_W

    width = IMAGE_W * BLOCK_W
    height = IMAGE_H * BLOCK_H
    bitdepth = 8 # [bit/sample]
    if DEPTH == 1:
        bitdepth = 1
        if BLOCK_W > 1:
            raise NotImplementedError("For bit depth of 1, only blocks of width 1 are supported")
        colortype = 0
    elif DEPTH == 8:
        colortype = 0
    elif DEPTH == 24:
        colortype = 2
    elif DEPTH == 32:
        colortype = 6
    else:
        raise NotImplementedError("Unsupported color depth {0}".format(DEPTH))
    compresstype = 0 # zlib (only supported method)
    filtermethod = 0 # adaptive (only supported method)
    interlaced = 0 # no

    maxEntropyBits = DEPTH * IMAGE_W * IMAGE_H
    print("Projected (maximum) entropy: {0} bits ({1} bytes)".format(
        maxEntropyBits,
        (maxEntropyBits + 7) >> 3,
    ))
    approxFileSize = (DEPTH * (IMAGE_W + 1) * IMAGE_H * BLOCK_W * BLOCK_H) >> 10 # approx / 1032
    approxFileSize += 64 # FIXME
    approxFileSize += maxEntropyBits
    print("Estimated file size: {0} bits ({1} bytes)".format(
        approxFileSize,
        (approxFileSize + 7) >> 3,
    ))

    if DEPTH == 1:
        bytesPerRow = (DEPTH * IMAGE_W + 7) >> 3
    else:
        bytesPerPixel = DEPTH >> 3
        if BLOCK_W > 1:
            pixelPadding = bytesPerPixel * (BLOCK_W - 1)
        bytesPerRow = bytesPerPixel * IMAGE_W
    rowPadding = bytesPerRow * BLOCK_W

    class RandomPixelWriter(CompressedPixelWriter):

        def writePixels(self):
            # This method uses globals, which is probably bad...

            for y in range(IMAGE_H):
                # Write scanline
                if BLOCK_W > 1:
                    self.write(b"\x01") # Sub
                    #prev = bytearray(bytesPerPixel)
                    for x in range(IMAGE_W):
                        # There is no need to subtract from prev,
                        # since random differences are still random.
                        self.write(urandom(bytesPerPixel))
                        self.writez(pixelPadding)
                else:
                    self.write(b"\x00") # no PNG filter
                    self.write(urandom(bytesPerRow))

                # Repeat previous scanline, at least one time, if needed
                for i in range(1, BLOCK_H):
                    self.write(b"\x02") # Up filter
                    self.writez(rowPadding)

    with open(OUTPUT_FILE, "wb") as f:
        # Signature
        f.write(b"\x89PNG\r\n\x1A\n")
        # IHDR
        IHDR = b"IHDR" \
            + I4(width) \
            + I4(height) \
            + B(bitdepth) \
            + B(colortype) \
            + B(compresstype) \
            + B(filtermethod) \
            + B(interlaced)

        f.write(I4(len(IHDR) - 4)) # 13
        f.write(IHDR)
        f.write(I4(zlib.crc32(IHDR)))
        # IDAT
        IDAT_len_offset = f.tell() # 33
        f.write(b"\0\0\0\0IDAT")
        pWriter = RandomPixelWriter(f.write)
        pWriter.finalize()
        f.write(I4(pWriter.crc32))
        # Fix length
        f.seek(IDAT_len_offset)
        f.write(I4(pWriter.length))
        f.seek(0, 2) # to end
        # IEND
        # 0x00000000 + "IEND" + CRC32("IEND")
        f.write(b"\0\0\0\0IEND\xae\x42\x60\x82")

if __name__ == '__main__':
    rPNG()
