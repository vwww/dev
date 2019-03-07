#!/bin/sh
themes=(
	"cerulean"
	"cosmo"
	"cyborg"
	"darkly"
	"flatly"
	"journal"
	"litera"
	"lumen"
	"lux"
	"materia"
	"minty"
	"pulse"
	"sandstone"
	"simplex"
	"sketchy"
	"slate"
	"solar"
	"spacelab"
	"superhero"
	"united"
	"yeti"
)

for theme in "${themes[@]}"
do
   curl https://bootswatch.com/4/$theme/bootstrap.min.css -o $theme.min.css
done
