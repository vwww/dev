/*
 * UltraFastZeroPNG.c
 *
 * This C99 program makes a huge PNG very fast.
 *
 * Copyright (c) 2017-2019 Victor Zheng
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

#define IMG_W (1 << 20)
#define IMG_H IMG_W

#include <stdio.h>
#include <stdint.h>
#include <time.h>

typedef uint8_t uchar;
typedef uint_fast8_t uint8;
typedef uint_fast16_t uint16;
typedef uint_fast32_t uint32;
typedef int_fast32_t int32;

uint32 crcTable[0x100];
void makeCRCtable()
{
#define POLY 0xedb88320 // reversed bit order
	for (uint16 i = 0; i <= 0xFF; ++i) {
		uint32 r = i;
		for (uint8 j = 8; j; --j)
			r = (r >> 1) ^ (POLY & (uint32)-((int32)r & 1));
		crcTable[i] = r;
	}
}

// For more speed, do the negations outside of these functions

uint32 crc32b(uint32 crc, const uchar c)
{
	return crcTable[c ^ (crc & 0xFF)] ^ (crc >> 8);
}

uint32 crc32buf(uint32 crc, const uchar *buf, size_t len)
{
	while (len--)
		crc = crc32b(crc, *buf++);
	return crc;
}

// matrix[i] is the ith column of the 32x32 matrix
// vec is a column vector
uint32 gf2_matrix_multiply(const uint32 matrix[32], uint32 vec)
{
	uint32 r = 0;
	for (const uint32 *m = matrix; vec; vec >>= 1, m++) {
		if (vec & 1)
			r ^= *m;
	}
	return r;
}

void gf2_matrix_square(uint32 dst[32], const uint32 src[32])
{
	for (uint8 i = 0; i < 32; i++)
		dst[i] = gf2_matrix_multiply(src, src[i]);
}

uint32 crc32zero(uint32 crc, size_t num)
{
	uint32 matrix[2][32];
	uint8 m = 0;

	matrix[0][0] = POLY;
	for (uint8 i = 1; i < 32; i++)
		matrix[0][i] = 1 << (i - 1);

	gf2_matrix_square(matrix[1], matrix[0]);
	gf2_matrix_square(matrix[0], matrix[1]);

	for (; num; num >>= 1) {
		gf2_matrix_square(matrix[m ^ 1], matrix[m]);
		m ^= 1;

		if (num & 1)
			crc = gf2_matrix_multiply(matrix[m], crc);
	}

	return crc;
}

void fwriteBytes(const uchar *buf, size_t len, uint32 *crc, FILE *f)
{
	*crc = crc32buf(*crc, buf, len);
	fwrite(buf, len, 1, f);
}

void fwriteZeros(size_t num, uint32 *crc, FILE *f)
{
	*crc = crc32zero(*crc, num);

#if 1
	// This works only if the system supports fseek past EOF
	// and fills the gap with zero bytes.
	fseek(f, num, SEEK_CUR);
#else
	static const uchar zeros[0x10000]; // initialized to 0

	// Write 64K blocks first
	for (size_t i = num >> 16; i; --i)
		fwrite(zeros, sizeof(zeros), 1, f);

	// Write last block
	num &= 0xFFFF;
	fwrite(zeros, sizeof(char), num, f);
#endif
}

#if 0
size_t fwriteDEFLATEzeroFirstBlock(uint16 num, uint32 *crc, int last, FILE *f)
{
	if (!num)
		return 0;

	uchar header[5] = {
		(uchar)(last ? 1 : 0),
		(uchar)(num >> 0),
		(uchar)(num >> 8),
	};
	header[3] = ~header[1];
	header[4] = ~header[2];

	fwriteBytes(header, sizeof(header), crc, f);
	fwriteZeros(num, crc, f);
	return sizeof(header) + num;
}
#endif

size_t fwriteDEFLATEzeros(size_t num, uint32 *crc, FILE *f)
{
	if (!num)
		return 0;

	// L tree
	// 0: 285 - length 258
	// 10: 0 - literal 0
	// 11: 256 - end of block
	// codelengths: 2, 0 * 138, 0 * 117, 2, 0 * 28, 1, (0...)

	// D tree
	// 0: 1
	// 1: unused
	// codelengths: 1, (0...)

	// code length tree
	// 0: 18
	// 10: 1
	// 11: 2

	// codelength codelengths in special order
	// 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15
	// 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, (0)

	// ------------------------------

	// Last block -> 1
	// Dynamic Huffman block -> 10
	// HLIT = 286-257 = 29 -> 11101
	// HDIST = 1-1 = 0 -> 00000
	// HCLEN = 18-4 = 14 -> 1110

	// packed codelength codelengths:
	//   000, 000, 001, 36 zero bits, 010, 000, 010
	// packed L tree:
	//   11, 0, 1111111, 0, 1101010, 11, 0, 0010001, 10 (reversed)
	// packed D tree:
	//   10 (reversed)

	const uchar header[] = {
		0xED, // 11101 10 1
		0xC0, // 110 00000
		0x81, // 1 000000 1-
		0x00, // 000000 00-
		0x00, // 00000000-
		0x00, // 00000000-
		0x00, // 00000000-
		0x80, // 10 000000-
		0xA0, // 1 010 000 0-
		0xFD, // 111111 0 1-
		0xA9, // 101010 0 1-
		0x17, // 0001 0 11 1-
	};
	uint16 buf = 0x29; // 01 01 001-
	uint8 bits = 7;

	fwriteBytes(header, sizeof(header), crc, f);
	size_t size = sizeof(header);

	// If num is a multiple of 258, write 258 literals!
	size_t q = (num - 1) / 258;
	size_t r = ((num - 1) % 258) + 1;

#define WRITE(v, s) { \
	buf |= v << bits; \
	bits += s; \
	if (bits >= 8) { \
		*crc = crc32b(*crc, buf & 0xFF); \
		fputc(buf & 0xFF, f); \
		++size; \
		buf >>= 8; \
		bits -= 8; \
	} \
}

	while (r--) {
		// write 10 (literal 0)
		WRITE(1, 2);
	}

	while (q--) {
		// write 00 (length 258, dist 1)
		WRITE(0, 2);

		if (!buf) {
			// This is how to get high speed!
			fwriteZeros(q >> 2, crc, f);
			size += q >> 2;

			// Use Duff's device instead of last 3 iterations
			switch (q & 3) {
			case 3: WRITE(0, 2);
			case 2: WRITE(0, 2);
			case 1: WRITE(0, 2);
			}
			break; // q = 0;
		}
	}

	// write 11 (end of block)
	WRITE(3, 2);

	// flush
	if (bits) { // (this is always true)
		*crc = crc32b(*crc, buf & 0xFF);
		fputc(buf & 0xFF, f);
		++size;
	}

	return size;
}

size_t fwriteZLIBzeros(size_t num, uint32 *crc, FILE *f)
{
	uchar header[2] = {
		0x78, // 32K window size, DEFLATE
		0x01, // "compressor used fastest algorithm"
		// because recompression might be worthwhile
	};
	uint32 adler = ((num % 65521) << 16) | 1;
	uchar trailer[4] = {
		(uchar)(adler >> 24),
		(uchar)(adler >> 16),
		(uchar)(adler >> 8),
		(uchar)(adler >> 0),
	};

	fwriteBytes(header, sizeof(header), crc, f);
	size_t sizeDEFLATE = fwriteDEFLATEzeros(num, crc, f);
	fwriteBytes(trailer, sizeof(trailer), crc, f);

	return sizeof(header) + sizeDEFLATE + sizeof(trailer);
}

void packInt32be(uint32 i, uchar *buf)
{
	buf[0] = (uchar)(i >> 24);
	buf[1] = (uchar)(i >> 16);
	buf[2] = (uchar)(i >> 8);
	buf[3] = (uchar)(i >> 0);
}

int fwritePNG(uint32 width, uint32 height, FILE *f)
{
	const size_t numBytes = (1 + (size_t)width) * height;

	// Signature
	fwrite("\x89PNG\r\n\x1A\n", sizeof(char), 8, f);

	// IHDR
	uchar IHDR[] = {
		'I',
		'H',
		'D',
		'R',
		(width >> 24) & 0xFF,
		(width >> 16) & 0xFF,
		(width >> 8) & 0xFF,
		(width >> 0) & 0xFF,
		(height >> 24) & 0xFF,
		(height >> 16) & 0xFF,
		(height >> 8) & 0xFF,
		(height >> 0) & 0xFF,
		8, // bitdepth
		0, // colortype
		0, // compresstype=zlib (only supported method)
		0, // filtermethod=adaptive (only supported method)
		0, // interlaced=no
	};

	uchar i32[4];
	packInt32be(13, i32); // 17-4
	fwrite(i32, sizeof(i32), 1, f);

	uint32 crc = 0xFFFFFFFF;
	fwriteBytes(IHDR, sizeof(IHDR), &crc, f);

	packInt32be(~crc, i32);
	fwrite(i32, sizeof(i32), 1, f);

	// IDAT
	long IDAT_len_offset = ftell(f); // 33
	fwrite("\0\0\0\0IDAT", sizeof(char), 8, f);

	crc = 0xCA50F9E1; // ~CRC32("IDAT")
	uint32 IDAT_len = (uint32)fwriteZLIBzeros(numBytes, &crc, f);

	packInt32be(~crc, i32);
	fwrite(i32, sizeof(i32), 1, f);

	// IEND
	// 0x00000000 + "IEND" + CRC32("IEND")
	fwrite("\0\0\0\0IEND\xae\x42\x60\x82", sizeof(char), 12, f);

	// Set IDAT length
	fseek(f, IDAT_len_offset, SEEK_SET);

	packInt32be(IDAT_len, i32);
	fwrite(i32, sizeof(i32), 1, f);

	return ferror(f);
}

int main()
{
	makeCRCtable();

	int ret = 0;
	FILE *f = fopen("out.png", "wb");
	if (!f)
		return -1;

	clock_t before = clock();

	ret = fwritePNG(IMG_W, IMG_H, f);

	clock_t after = clock();

	fclose(f);

	double diff = (double)(after - before) / CLOCKS_PER_SEC;
	double rate = ((1 + IMG_W) * (double)IMG_H) / diff;
	rate = rate * 8 / 1024 / 1024 / 1024 / 1024;
	printf("Compressed at %.2f Tbit/s (%.9f s)\n", rate, diff);

	return ret;
}
