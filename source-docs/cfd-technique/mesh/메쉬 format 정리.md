# 메쉬 format 정리

> 원본: `mesh/메쉬 format 정리.docx`

오픈폼->VTU 세이버->텍플랏->앤시스
VTK
VTU
Tecplot
STL
Ply
Polygon
OFF
Object file format.
Example
OBJ
STEP
이건 나중에.. NURBS로 하기 때문에.
IGES
캐드 확장자.
CGNS
Hdf5 를 사용해야됨.
ANSYS Fluent
2차원, 3차원 모두 표현
Cas 파일, cas.h5, cas.gz 파일이 있다.
Cas -> legacy 파일, ascii, binary
Cas.h5 -> hdf5 압축
Cas.gz -> gz 압축 (zlib)
파일 형태
(idx sub) ->
idx=0 : 코멘트, idx=1 : 헤더, idx=2 : 차원
idx=10 : 포인트, idx=2010 : float 형식 포인트, idx=3010 : double 형식 포인트
idx=12 : 셀, idx=2012 : 32비트 셀, idx=3012 : 64비트 셀
idx=13 : 페이스, idx=2013 : 32비트 페이스, idx=3013 : 64비트 페이스
idx=39 : zone
idx=45 : 바운더리
sub 내용은 string 형식일 수도 있다. Ascii 내용은 16진수를 써서 나타낸다. binary 는 10진수이다.
Abaqus
.inp 파일.
OpenFoam
Star-CCM+
.ccm 확장자
Comsol
.mphbin -> binary
.mphtxt -> ascii
.xml
