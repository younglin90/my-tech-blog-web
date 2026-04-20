# MRT 유도

> 원본: `LBM/MRT 유도.hwp`

Multiple relaxation times


-> 
,  is the number of discrete velocities


 : a diagonal matrix

=>

=>

따라서,  이면, MRT 는 LBGK 로 된다.

(1) Standard D2Q9 model
The corresponding moments

The equilibria in the moment space

,  are two free parameters,
, 
The transformation matrix

The relaxation rates corresponding to the moments are

, ,  는 보존과 관련된 모멘트, 0으로 셋팅함


, 

(2) MRT with force D2Q9 model

 은 위에랑 같음.
 : 0에서 2까지, 선형 안정성을 유지하기 위함.





(3) Karlin
