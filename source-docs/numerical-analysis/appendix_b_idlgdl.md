# appendix_b_idlgdl

> 원본: `numerical-analysis/appendix_b_idlgdl.pdf` (0.0MB, 7 페이지 추출)

## 페이지 1
Appendix B
A brief introduction to IDL/GDL
Although the exercises may be done in any true programming language that the student is fa-
miliar with (e.g. C, C++, F77, F90, F95, PASCAL, ...), we will givesupport mainly in a simple
programming environment called IDL (Interactive Data Language). Since IDL is proprietary
software, and licenses are extremely expensive, we will make use of an open-source clone of
IDL, called GDL (Gnu Data Language). This project is still under development, so it will not
havethecompletefunctionalityofIDL.However,itwillbesufficientformakingsmallprograms
and makingplots.
ThemainadvantagesofusingGDLfortheexercisescomparedtomanyotherprogramming
languagesare:
1. The programming language is interpreter-based, meaning that you do not compile a pro-
gramfirstandthenrunitfromthecommand-line,butyougointoGDL,getaGDL-prompt
and you can do command-line calculations. The prompt is so-to-speak the main routine,
and any command you type is immediately executed. It is therefore an interactive pro-
gramming language. At the same time you can also run a program (which is almost - but
not 100% - thesame as a series of command-linestatements boundtogether in a file or in
asubroutine).
2. You can plot the results of your programs immediately, without having to write results,
read themintoGNUPLOT orsomethingsimilar.
3. If a program stops due to a STOP statement or an error, then the prompts is stuck right
thereinthesubroutinewherethestoporerrortookplace. Soyoucantype“print,a”tosee
what variable a contains, even if this is a local variable in a subroutine. By deliberately
puttinginSTOPstatementsintoaprogramthatcontainsanunfixedbugyoucandebugthe
code. A simple“.c” is sufficient to continuethe program after that stop statement. This is
theultimatedebuggingtool!
4. The GDL programming language is very easy (although it has its nasty unlogical things,
too): itis verysimilartotheBASIC programminglanguage.
5. It has the possibilityto handlelarge arrays at once, with a single command. This requires
abitofexercise,butcan beveryhandy.
Thedisadvantagesare:
39

## 페이지 2
40
1. GDL is slow as a programming language. For multi-D hydrodynamics modeling it is
utterly inadequate. But we shall use it as an interface for external Fortran programs. In
GDL we will set up the problem, write a set of input files for the Fortran program, then
we run the Fortran program externally from GDL, and at the end we read the output files
of the Fortran program into GDL for plotting. This will be done for all more complex
problemsinvolvingmulti-Dhydrodynamics.
2. GDLisstillan experimentalpackage, sosometimesthingsthatworkbrilliantlyinIDLdo
not work in GDL. We will have to see when this takes place, although this presumably
doesnot takeplaceforthebasicthingswe wantto do.
B.1 Getting started
Let usmakeafew command-lineexercises. First wegointoGDL bytyping:
> gdl
intheprompt(the>is theshellprompt). Wethen get aGDLprompt:
gdl>
From now on wheneverthereis a “gdl>”wemean thatthis is theprompt,and the textbehind it
iswhat wetypein. Anynextlinesareusuallytheresultofwhatwe type. So nowtype
gdl> print,’Hello world’
Hello world
toget thefamoussentence. Wecan define avariable:
gdl> a=7
gdl> print,a
7
By typing a=7 instead of a=7. we tell GDL that a is an integerand not a floating-point variable.
So ofwedo
gdl> a=7
gdl> print,a/2
3
But nowthis:
gdl> a=7.
gdl> print,a/2
3.5
Notethatthereisadifferencebetweenreal(*8)floatingpointsanddoubleprecision(*16)floating
points:

## 페이지 3
41
gdl> a=7.e0
gdl> print,sqrt(a),format=’(E29.22)’
2.6457512378692626953125E+00
gdl> a=7.d0
gdl> print,sqrt(a),format=’(E29.22)’
2.6457513110645907161711E+00
and noticetheway thatformattingworks. Tofind out whattypeavariablehas wecan type
gdl> help,a
<Expression> DOUBLE = 7.0000000
Nowtype
gdl> a=fltarr(10)
gdl> print,a
0.00000 0.00000 0.00000 0.00000
0.00000 0.00000 0.00000 0.00000
0.00000 0.00000
Thisisan array ofnumbers. Wecan do
gdl> a=dblarr(10)
gdl> for i=0,9 do a[i]=i
gdl> print,a
0.00000 1.00000 2.00000 3.00000
4.00000 5.00000 6.00000 7.00000
8.00000 9.00000
Thereis apowerfulshortcutforthis:
gdl> a=dindgen(10)
gdl> print,a
0.00000 1.00000 2.00000 3.00000
4.00000 5.00000 6.00000 7.00000
8.00000 9.00000
gdl> help,a
A DOUBLE = Array[10]
Notethatdblarrhasa (*8)float variantcalledfltarr, and dindgenhasfindgen. Nowtype
gdl> a = a+6
gdl> print,a
6.0000000 7.0000000 8.0000000 9.0000000
10.000000 11.000000 12.000000 13.000000
14.000000 15.000000
gdl> b=dindgen(10)
gdl> print,a-b
6.0000000 6.0000000 6.0000000 6.0000000
6.0000000 6.0000000 6.0000000 6.0000000
6.0000000 6.0000000

## 페이지 4
42
Thisshowstheease withwhichonecan manipulatedatain GDL.
Nowforsomeplotting
gdl> nx=100
gdl> xmin=-2*!pi
gdl> xmax=2*!pi
gdl> x=xmin+(xmax-xmin)*dindgen(nx)/(nx-1.d0)
gdl> y=sin(x)
gdl> plot,x,y
Thisshouldproducea nicesinuscurve. Nowtry
gdl> plot,x,y,psym=6
gdl> plot,x,y,psym=-6
gdl> plot,x,y,psym=3
gdl> plot,x,y,line=2
gdl> window,2
gdl> plot,y,x
gdl> wset,0
gdl> plot,y,x
Nowwithtitlesand stuff
gdl> plot,x,y,xtitle=’x’,ytitle=’y’,title=’A nice plot’
Wecan also constraintheplottingdomain
gdl> plot,x,y,xrange=[-4,4]
SometimesGDLthinksabittoomuch,anddoesthingsnotthewaywewant. Wecanforceitto:
gdl> plot,x,y,yrange=[-1.2,1.2]
gdl> plot,x,y,yrange=[-1.2,1.2],ystyle=1
Coloris abitmorecomplexinIDL. First wehavetochooseifwewant to havefull control
overtheRGBcolors,orifwewanttohaveacolor-map(inwhich256colorsarepre-chosenand
youonlyhavetogiveanumber0 to255 tochoosewhichcolor).
gdl> rc=1L
gdl> gc=256L
gdl> bc=256L*256L
gdl> device,decomposed=1
gdl> plot,x,y,color=120*rc,80*gc,250*bc
gdl> device,decomposed=0
gdl> loadct,3
% LOADCT: Loading table RED TEMPERATURE
gdl> plot,x,y,color=160
The256L(theL)standsforlong-integer. Wecan alsodo this

## 페이지 5
43
gdl> device,decomposed=0
gdl> loadct,12
% LOADCT: Loading table 16 LEVEL
gdl> plot,x,y,color=160
gdl> plot,x,y,/nodata,color=255
gdl> oplot,x,y,color=140
gdl> oplot,x,y*0.4,color=20
Wecan alsoplottopostscriptfiles.
gdl> set_plot,’ps’
gdl> plot,x,y
gdl> device,/close
gdl> set_plot,’x’
Thisplotstothefileidl.ps. Notethatthistimetheplotison awhitebackground...
CAREFUL:Thedevice,/closeiscrucual!
CAREFUL: It is useful to set the plot back to ’x’ after any ’ps’ plotting, because otherwise one
maywonderwhyonedoesnot seeanythingonthescreen!
Wecan also directlyspecify thefile name:
gdl> set_plot,’ps’
gdl> device,file=’myplot.ps’
gdl> plot,x,y
gdl> device,/close
gdl> set_plot,’x’
In postscript, color works a bit different from x. We have, for lines, only color tables, and we
mustexplicitlytell thedevicetousecolorandhow‘true’thecolorshouldbe:
gdl> set_plot,’ps’
gdl> device,file=’myplot.ps’,/color,bits_per_pixel=24
gdl> loadct,12
gdl> plot,x,y,color=160
gdl> device,/close
gdl> set_plot,’x’
Openingand writingfiles
gdl> a=dindgen(10)
gdl> openw,1,’mydata.out’
gdl> printf,1,a
gdl> close,1
Reading thisfileback in:
gdl> a=dindgen(10)
gdl> openr,1,’mydata.out’
gdl> readf,1,a
gdl> close,1
gdl> print,a

## 페이지 6
44
Noticetheopenrinsteadofopenwhere.
Finally let us create a structure, which is nothing else than a package of variables put to-
gether into a single entity. It is often the most useful way to transfer heterogeneous sets of data
inonego.
gdl> a=1.5
gdl> b=’Hello’
gdl> c=1
gdl> d=[4.,5.,7.]
gdl> s={a:a,b:b,c:c,d:d}
gdl> print, s.a
1.5000000
gdl> print, s.b+’. This is a full sentence.’
Hello. This is a full sentence.
B.2 Programming in GDL
The above commands can be grouped into a subroutine or a program. In such modules we can
even use more kinds of constructions. Let us make a littleprogram (to show that it is a file, it is
marked herewith<filename>, butofcoursethisisNOT thefirst lineofthat file.)
<myprog.pro>
a=1.d0
for i=1,10 do begin
a=sqrt(a+1.)
endfor
print,a
end
Nowto runthisprogram wetype
gdl> .r myprog.pro
1.6180286
Wecan also haveif-statements:
<myprog.pro>
a=1.d0
for i=1,10 do begin
a=sqrt(a+1.)
if a lt 1.6 then print,’yes!’
endfor
print,a
end
or
<myprog.pro>
a=1.d0

## 페이지 7
45
for i=1,10 do begin
a=sqrt(a+1.)
if a lt 1.6 then begin
print,’yes!’
print,’ once more... Yes!’
endif else begin
print,’No...’
endelse
endfor
print,a
end
