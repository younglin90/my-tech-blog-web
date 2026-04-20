# [18-08-29] FlameMaster 사용법

> 원본: `combustion/[18-08-29] FlameMaster 사용법.hwp`

1. thermo 데이터와 transport 데이터를 찾아서 0_thermo_trans 폴더에 넣어준다.
2. [CreateBinFile -i ./DataFiles/gri.30.therm -m ./DataFiles/gri.30.trans –o a.out]  를 입력하여 thermo & trans out 데이터를 만들어준다.
3. [ScanMan -i ./DataFiles/gri.30.mech -t a.out –o output.pre]  으로 메카니컬 데이터를 만들어준다.
4. FlameMaster.input 인풋 파일에 들어간다.
5. 설정을 다 끝마친후 [FlameMaster -i FlameMaster.input –r output.pre]를 입력한다.
6. LT CH4_p01_0chi000*를 하여 kg 파일을 만든다.

==> Libgen (library generation) 하기.
ifort Flmeletgen.f90을 하면 a.out 파일이 만들어진다.
data_list.inp 파일에 가서 만들어줄 파일을 입력해준다.
./a.out을 입력한다.
