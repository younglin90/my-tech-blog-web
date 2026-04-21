# [20-03-27] 포트란 makefile

> 원본: `code/[20-03-27] 포트란 makefile.docx`

명령어의 시작은 반드시 탭으로 시작한다.
= 확장자 규칙의 이용
Fortran 컴파일 (XX.f 또는 XX.F -> XX.o)
FFLAGS = (Fortran 컴파일러의 플래그)
= 매크로 치환
MY_NAME = Michael Jackson
YOUR_NAME = $(NAME:Jack=Jook)
MY_NAME 에서 Jack 이 Jook 으로 치환되서 YOUR_NAME 에 값 저장.
= 순환 make
다양한 makefile 을 한번에 동작시키기
.SUFFIXES = .c .o
CC = gcc
CFLAGS = -O2 -g
all : DataBase Test <- 요기에 집중.
DataBase:
cd db ; $(MAKE) <- db 로 이동해서 make 실행
Test:
cd test ; $(MAKE) <- test로 이동해서 make 실행
FCOMPLR = /opt/intel/MPI/4.1.3.045/bin64/mpiifort
: 포트란 컴파일러입니다. 여기선 인텔 mpi 포트란인 mpiifort를 사용합니다.
FFLAGS = -c -g -O3 -xavx
: 포트란 컴파일러의 플래그입니다. 컴파일 할 때 옵션이라고 생각하시면 됩니다.
all : $(EXE)
: 창에 make 또는 make all 했을 때, 타겟 (EXE) 을 실행시켜줍니다.
$(EXE) : $(OBJECTS)
$(FCOMPLR) -o $@ $(OBJECTS) -lstdc++ lib/libtecio.a lib/libmetis.a
@echo " "
@echo "CODE compile/link complete"
: OBJECTS 들을 (의존자, depend) EXE 로 (타겟, target) 만들어줍니다. 2번째 줄은, FCOMPLR (포트란 컴파일러) 로 .o 파일들인 (-o) OBJECTS 을 서로 엮어줍니다. 그리고 이 문장에서 $@ 는 타겟을 말합니다. 추가적으로 lib 폴더 안에 c++ 라이브러리 파일인 lib/libtecio.a lib/libmetis.a 도 엮어줍니다. 여기서 -lstdc++ 는 c++ 라이브러리를 엮어주는 명령어입니다. 그리고 @echo 는 이하의 문장들을 창에 프린트 해주는 명령어입니다.
%.o : %.f90
$(FCOMPLR) $(FFLAGS) ${OPTIONS} $< -o $@
: %.o : %.f90 는 확장자 규칙이고, 확장자 규칙이란 파일의 확장자를 보고 그에 따라 적절한 연산을 수행하도록 미리 정의된 규칙입니다. 여기서 $< 는 현재 타겟보다 더 최근에 업데이트한 파일명을 의미합니다. (또한, $^ 는 의존자 전체를 의미합니다.)
다음은 실행 순서입니다.
1) 제일 처음에 나오는 all 이라는 타겟을 만나서 의존자 리스트를 확인합니다. EXE 라는 의존자를 찾았습니다.
2) 의존자를 만족하기 위해 EXE라는 타겟을 찾습니다. 그리고 EXE의 의존자 리스트인 OBJECTS (여러 파일들)를 찾았습니다.
3) OBJECTS (여러 파일들 중 첫번쨰) 의 타겟을 찾기 위해 OBJECTS 의 첫번째 (OBJ1.o 이라 합시다) 에 해당하는 의존자(OBJ1.f90 라 합시다) 를 찾습니다. 현재 디렉토리에 이 OBJ1.o 파일이 없거나 OBJ1.o 파일의 수정 시간이 OBJ1.f90 파일의 수정시간보다 이전일 때 포트란 컴파일러와 플래그인 FCOMPLR FFLAGS OPTIONS 라는 커맨드를 실행시킵니다. 그렇지 않은 경우에는 아무것도 실행하지 않습니다.
4) OBJ1.o 가 잘 만들어졌으면 다시 OBJECTS 의 두번째, 세번째, … 도 같은방법으로 실행시킵니다.
5) EXE 의 의존자가 다 만족되었으면 FCOMPLR -o EXE OBJECTS 라는 커맨드를 실행하여 EXE 라는 타겟을 만듭니다.
6) EXE 라는 타겟이 만들어졌으면 all 이라는 타겟으로 돌아갑니다.
7) all 의 의존자가 다 만족되었고, 커맨드가 없으므로 make가 끝나게됩니다.
EXE    = ./core.exe
: EXE 의 정의 입니다.
SOURCES = src/modConstants.f90\
src/modParallel.f90\
…..
: SOURCES 의 정의입니다.
OBJECTS = $(SOURCES:.f90=.o)
: OBJECTS 는 SOURCES에서 .f90 을 .o 로 바꿔준 파일들을 의미합니다.
OPTIONS =
: 빈공간입니다.
help:
@echo This is the make system for Unst3D.
: make help 를 치면 나타내는 명령어입니다.
jet:
@echo make -f make-all/makefile.jet   OBJECTS
@     make -f make-all/makefile.jet   "OBJECTS = ${OBJECTS}" "EXE = ${EXE}" "OPTIONS = ${OPTIONS}
: make jet 를 치면 나타나는 명령어입니다. make -f make-all/makefile.jet   OBJECTS 가 우선적으로 프린트 됩니다. 그 후 두번째 문장이 실행되는데, make-all/makefile.jet 파일에서 OBJECTS와 EXE, 그리고 OPTIONS을 본 파일의 OBJECTS, EXE, OPTIONS 로 치환합니다. 그리고 -f 명령어는, 기본적으로 특정 makefile 을 실행시키기 위해 실행시킬 makefile 앞에 붙여주는 옵션 명령어입니다.
new :
touch $(SOURCES) ; $(MAKE)
: make new 를 치면 나오는 명령어입니다. Touch 는 생성 시간이나 수정 시간을 최근의 시간으로 변경해주는 명령어입니다. 따라서 SOURCES 들 전부를 최근에 수정됐다고 변경합니다. 그 후 MAKE 가 실행되는데, 소스 파일들은 최근에 수정됐다고 판단되므로 전체파일을 다시 컴파일하게 됩니다. 그리고 ; 는 문장을 이어줄 때 사용합니다.
clean:
rm -f $(OBJECTS) $(EXE) *.o src/*.mod *.mod
: make clean 을 치면 나오는 명령어입니다. OBJECTS, EXE 파일과 .o, src/.mod .mod 확장자들을 없애줍니다.
veryclean: clean
rm -f ${EXE}
: make veryclean 을 치면 나오는 명령어입니다. EXE 를 추가적으로 없애줍니다.
