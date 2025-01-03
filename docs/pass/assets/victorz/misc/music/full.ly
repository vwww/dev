\header {
  title="LOL (too much to handle?)"
  composer="Victor the best composer"
  tagline="Play every piano note, all semitones and do not release the pedal!\nIt only takes 4 seconds!"
}

\version "2.12.0"

upperrepeatw = { <
	bisis''' aisis''' gisis''' fisis''' eisis''' disis''' cisis'''
	bisis'' aisis'' gisis'' fisis'' eisis'' disis'' cisis''
	bisis' aisis' gisis' fisis' eisis' disis' cisis' 
	bisis aisis gisis fisis eisis disis cisis
	bisis,
	> 1 ~
}

lowerrepeatw = { <
	beses,,,, aeses,,,, geses,,,, feses,,,, eeses,,,, deses,,,,
	ceses,,, beses,,, aeses,,, geses,,, feses,,, eeses,,, deses,,,
	ceses,, beses,, aeses,, geses,, feses,, eeses,, deses,,
	ceses, beses, aeses, geses, feses, eeses, deses,
	ceses beses aeses geses feses eeses deses
	> 1 ~ 
}

upperrepeath = { <
	cis dis fis gis ais
	cis' dis' fis' gis' ais'
	cis'' dis'' fis'' gis'' ais''
	cis''' dis''' fis''' gis''' ais'''
	> 1 ~
}

lowerrepeath ={ <
	des ees ges aes bes
	des, ees, ges, aes, bes,
	des,, ees,, ges,, aes,, bes,,
	des,,, ees,,, ges,,, aes,,, bes,,,
	> 1 ~
}

upperlol = { \upperrepeatw \upperrepeatw \upperrepeatw \upperrepeatw \upperrepeatw \upperrepeatw \upperrepeatw \upperrepeatw }
lowerlol = { \lowerrepeatw \lowerrepeatw \lowerrepeatw \lowerrepeatw \lowerrepeatw \lowerrepeatw \lowerrepeatw \lowerrepeatw }
upperlols = { \upperrepeath \upperrepeath \upperrepeath \upperrepeath \upperrepeath \upperrepeath \upperrepeath \upperrepeath }
lowerlols = { \lowerrepeath \lowerrepeath \lowerrepeath \lowerrepeath \lowerrepeath \lowerrepeath \lowerrepeath \lowerrepeath }

sop =  \transpose c c'{
	\voiceOne
	\key cisis \major
	\upperlol \break
	\key cis \major
	\upperlols \break
	\bar "||"
	\key c \major
	b1\rest
	b2\rest b2\rest
	b4\rest b4\rest b4\rest b4\rest
	b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest b8\rest
	b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest b16\rest
	b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest b32\rest
	b2.....\rest b64\rest
	b1\rest
	\bar "|."
}

tenor = {
	\voiceTwo
	\key ceses \major
	\lowerlol \break
	\bar "||"
	\key ces \major
	\lowerlols \break
	\bar "||"
	\key c \major
	d1\rest
	d2\rest d2\rest
	d4\rest d4\rest d4\rest d4\rest
	d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest d8\rest
	d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest d16\rest
	d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest d32\rest
	d2......\rest d128\rest
	d1\rest
	\bar "|."
}

global = {
	\override Staff.TimeSignature #'style = #'neomensural
	\time 2/2
	\tempo 128=61440
	#(set-accidental-style 'piano)
}

upperStaff = \context Staff = upper<< 
	\global
	s1*0 \sustainOn
	\clef "G"
	  <<
	   \context Voice = "upper"    \sop
	  >>
>>

lowerStaff = \context Staff = lower<<
	\global
	\clef "F"
	<<
	    \context Voice = "lower" \tenor
	>>
>>
\score{
 %\transpose bes c'
	<<
		\upperStaff
		\lowerStaff
	>>

	\layout {
	  indent = 0.0\mm
	}

	\midi {
	}
}