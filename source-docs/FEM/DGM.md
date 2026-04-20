# DGM

> 원본: `FEM/DGM.docx`

DGM 정리
: convective flux,   : viscous flux,   : source term
a linear combination of a basis functions
따라서 시험함수를 곱해서 체적에 대해 적분하면,
여기서,
그러면,
그리고,
그리고,
그리고
정리하면,
그리고
따라서, 다음처럼 두개 방정식으로 나눌 수 있음
위 식을 gauss-quadrature 해야됨. 최소 2K-1 오더의 적분을 수행해야 차수가 감소하지 않음.
알고리즘 과정
셀을 형태로 구분. 테트라/헥사/프리즘/피라미드/폴리헤드론
면을 형태로 구분. 삼각/사각/폴리곤
각 형태에 따른 가우스 쿼드러쳐 준비
(1,4,10,20,35) 개,   (1,4,10,20,35)*3 개, 구하기 -> 가우스 포인트의 값을 메모리에 저장
값 초기화
레퍼런스
A discontinuous Galerkin method based on a Taylor basis for the compressible flows on arbitrary grids
Hybrid discontinuous Galerkin-finite volume techniques for compressible flows on unstructured meshes
