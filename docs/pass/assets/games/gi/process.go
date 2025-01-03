package main

import (
	"bufio"
	"fmt"
	"image"
	"image/draw"
	"image/png"
	"os"
	"path"
)

func main() {
	wmfile, err := os.Open("./watermark.png")
	if err != nil {
		panic(err)
	}
	defer wmfile.Close()

	wmimg, _, err := image.Decode(wmfile)
	if err != nil {
		panic(err)
	}

	srcRect := wmimg.Bounds()

	for _, inFilePath := range os.Args[1:] {
		outFilePath := path.Join(inFilePath, "../../out", path.Base(inFilePath))
		fmt.Printf("%v -> %v\n", inFilePath, outFilePath)

		if _, err := os.Stat(inFilePath); os.IsNotExist(err) {
			fmt.Println(" skipped (source missing)")
			continue
		}

		if _, err := os.Stat(outFilePath); !os.IsNotExist(err) {
			fmt.Println(" skipped (destination exists)")
			continue
		}

		inFile, err := os.Open(inFilePath)
		if err != nil {
			panic(err)
		}
		defer inFile.Close()

		outFile, err := os.Create(outFilePath)
		if err != nil {
			panic(err)
		}
		defer outFile.Close()

		inimg, _, err := image.Decode(inFile)
		if err != nil {
			panic(err)
		}

		dstRect := inimg.Bounds()

		img := image.NewRGBA(dstRect)
		// Original
		draw.Draw(img, img.Bounds(), inimg, image.ZP, draw.Src)
		// OLD: 80x10 of 0x64646464 @ bottom
		/*
			gray := color.RGBA{0x64, 0x64, 0x64, 0x64}
			draw.Draw(img, srcRect.Sub(srcRect.Max).Add(dstRect.Max), &image.Uniform{gray}, image.ZP, draw.Src)
		*/
		// Watermark
		draw.Draw(img, srcRect.Sub(srcRect.Max).Add(dstRect.Max), wmimg, image.ZP, draw.Over)

		w := bufio.NewWriter(outFile)
		png.Encode(w, img)
		if w.Flush() != nil {
			panic(err)
		}

		fmt.Println(" done")
	}

	fmt.Println("Press Enter to quit...")
	fmt.Scanln()
}
