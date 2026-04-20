# Flamemaster man

> 원본: `combustion/Flamemaster man.pptx`

## 슬라이드 1
2018 SummerCombustion Seminar
Presented by Hwang Hyeonmin, Lee Kyobin, Kang Jeongseok

## 슬라이드 2
Flamemaster
2. Exercise
Contents
Installation
Theory
Manuel
Introduction
Theory (les)
Operating condition and Schemes
Result

## 슬라이드 3
CUDA ID 생성
CUDA Server 접속
Flamemater source file 다운
mkdir Build && cd Build
cmake ../Repository -DCMAKE_BUILD_TYPE=Release
make
make install
cd ~
vi .bashrc
source /path/source.bash
Flamemaster (Installation)

## 슬라이드 4
Flamemaster (Theory)
; PDF defines a probability distribution for a continuous random variable.
The likelihood that clock hands point 12 o’clock is 0.
PDF defines a probability with interval.
어떤 구간 더 빈번하게 나올지 모름으로 CDF의 미분인 PDF를 이용한다.
표준 분포를 가지는 PDF

## 슬라이드 5
Flamemaster (Theory)
PDF 동적 분석 베이지안
Beta 함수
Eddy 그림 설명
filter
간략소개

## 슬라이드 6
Flamemaster (Theory)
Mixture fraction
Scalar Transport eq.
Scalar dissipation rate
S curve

## 슬라이드 7
Flamemaster (Theory)
Scalar dissipation rate
S curve

## 슬라이드 8
Flow chart
Flamemaster (Manuel)

## 슬라이드 9
Programs(CreateBinFile)
: CreateBinFile converts ACS𝜤𝜤 files containing thermos. And trans. Properties into a binary thermodata file.
Command and options
CreateBinFile –i thermodatainputfile[.txt] –m transportdatainputfile –o thermodataoutputfile[.bin]
If omitted then thermodatainputfile is to be assumed in FlameMaster style.
NASA style
Thermo. data
: The thermodynamic data file contains four lines per species with fixed positions for the entries.
Trans. data
: The transport data file contains one line per species with fixed positions for the entries.
Flamemaster (Manuel)

## 슬라이드 10
Programs(ScanMan)
: ScanMan processes the chemical mechanism file, converts it to a binary file and adds the thermo-trans binary data.
Command and options
ScanMan –i mechanism[.mech] –t thermodata[.bin] –o outputfile[.pre] [-abcdh etc…]
Result Files
Outputfile[.pre]
Mechanism.h
Mechanism.chemh
Mechanism.thermo
Mechanism.trans
-a : A list of declared and actually used atoms will be generated.
Flamemaster (Manuel)

## 슬라이드 11
Programs(FlameMaster)
: FlameMaster is a tool for numerical modeling of combustion processes.
Command and options
FlameMater –i inputfile[.input] –s startsolution –r thermo-mech[.pre] –o outputpath
How to change the mechanism from the old one.
Edit Global reaction in the startsolution
Change mech[.pre]
Change Boundary Condition
In the inputfile[.input]
ListTool out_p01_0chi*
Output[.kg]
: [.kg] files are for making a Library.
Flamemaster (Manuel)
