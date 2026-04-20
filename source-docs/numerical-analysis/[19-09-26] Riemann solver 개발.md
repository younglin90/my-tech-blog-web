# [19-09-26] Riemann solver 개발

> 원본: `numerical-analysis/[19-09-26] Riemann solver 개발.hwp`

SLAU 역사 정리
* SHUS [1]
뭔 이유에서인지 모르겠는데, Roe를 AUSM 형태로 바꿔줌



여기서 어떤이유인지 모르겠는데




References

[1] Shima, Eiji, and Tadamasa Jonouchi. "Role of CFD in aeronautical engineering. No. 14: AUSM type upwind schemes." title 航空宇宙技術研究所特別資料 Special Publication of National Aerospace Laboratory (1997): 7.
The shock-capturing schemes 은 일반적으로 central term  의 합과 numerical dissipation term 로 구성되어있다.

central term 은 다음과 같다.


Scalar form of the Roe scheme [1,2]






세 개의 항들은 explicit 물리적인 의미를 가진다. 첫 번째 항은 basic upwind dissipation 이고, 두 번째 항은 modification to the interface pressure, 그리고 세 번째 항은 modification to the interface fluxes 이다. 첫 번째와 두 번째 항은 low-mach number에서 non-physical 항동에 대해 critical effect를 가졌다. 그리고 세 번째 항은 pressure checkerboard mode를 막는데 중요한 역할을 한다. 
Roe-type에서 다음과 같다.






또한 ,  은 pressure-difference 와 Mach-difference term 으로 분류할 수 있다.






 ,  , 

마하수로 나타내면 다음과 같다. (영린이가 함)





Extended Scalar form for the AUSM scheme [1]










는 각각 에너지 방정식과 다른 방
