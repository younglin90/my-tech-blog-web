# [SEMO] LBM 코드 구조

> 원본: `code/[SEMO] LBM 코드 구조.hwp`

SEMO LBM 클래스들

네임스페이스는 대문자, _ 로 구분
클래스는, 첫문자 대문자, 나머진 소문자, _ 로 구분
함수는 소문자, 카멜
save/load -> 시스템 파일 저장/로드

<SEMO_MESH SEMO_DATA SEMO_CONTROL SEMO_SHAPE  >

<SEMO_MESH  메쉬 종류 <Point_Based Face_Based Cell_Based Octree_Based Voxel_Based>  Face_Based <readStl -> stl 파일 읽기>  Point (face에 소속되어 있는) <메모리 배열 순서 : internal, boundary, processor x, y, z> Face (cell에 소속되어 있는) <메모리 배열 순서 : internal, boundary, processor center, > Cell Block  Boundary Boundary_Type <inlet, outlet, wall, symmetric, periodic, function>   >

<SEMO_DPM Parcel>

<SEMO_IMMERSED_BOUNDARY Point Edge>

<SEMO_DATA Variable <Point Face Cell Block Field  Parcel>  >

<SEMO_CONTROL Boundary <function><input><output>
<extract><><SEMO_CONTROL::Boundary> <setAll, set_xmin, set_xmax, set_ymin, set_ymax, set_zmin, set_zmax, setFromShape>  >

<SEMO_MATH Shape <triangle, sqaure,   tetrahedral, sphere>    >

구현해야할 것 정리
namespace semo::geometry
face_mesh read_stl(std::string file_name)
face_mesh& refine_all_face(face_mesh& inp_face_mesh)
