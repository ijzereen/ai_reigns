# AI Reigns New - React Project

이 프로젝트는 Figma 디자인을 기반으로 한 React 애플리케이션입니다.

## 프로젝트 구조

```
src/
├── pages/
│   ├── login/
│   │   ├── LoginPage.tsx
│   │   └── LoginPage.css
│   ├── settings/
│   │   ├── SettingsPage.tsx
│   │   └── SettingsPage.css
│   └── editor/
│       ├── EditorPage.tsx
│       └── EditorPage.css
├── App.tsx
├── App.css
└── index.tsx
```

각 페이지는 독립적인 폴더에 저장되며, 각 폴더에는 해당 페이지의 TypeScript 컴포넌트와 CSS 파일이 포함됩니다.

## 시작하기

### 개발 서버 실행

```bash
npm start
```

개발 서버가 http://localhost:3000에서 실행됩니다.

### 빌드

```bash
npm run build
```

프로덕션 빌드를 생성합니다.

## 현재 구현된 페이지

### 로그인 페이지 (`/src/pages/login/`)
- Figma 디자인을 정확히 재현한 로그인 인터페이스
- 반응형 디자인 지원
- 폰트: Imbue, Inknut Antiqua
- 기능: 아이디/비밀번호 입력, 로그인 버튼, 비밀번호 찾기, 회원가입 링크
- 로그인 성공 시 설정 페이지로 이동

### 설정 페이지 (`/src/pages/settings/`)
- 게임 초기 설정을 위한 인터페이스
- 스토리 줄거리 입력 (textarea)
- 등장인물 설정 (이름과 설명, 3명까지)
- 스토리 생성하기 버튼
- 완전 반응형 디자인 지원
- 모바일에서는 등장인물 입력 필드가 세로 배치로 변경
- 스토리 생성 후 에디터 페이지로 이동

### 에디터 페이지 (`/src/pages/editor/`)
- React Flow 기반의 노드 에디터 화면
- **좌측 사이드바**: 이미지 패널 (빨간 배경에 반투명 그라데이션)
- **메인 에디터 영역**: 노드를 드래그 앤 드롭으로 배치 및 연결
- **우측 노드 팔레트**: 3가지 노드 타입
  - Story 노드 (검은색 #0D0D0D)
  - Choice 노드 (주황색 #FF8C00)
  - Ask 노드 (네이비색 #003366)
- **우상단 북 아이콘**: 📖 이모지로 표현된 북 아이콘
- **우하단 플러스 버튼**: 큰 원형 추가 버튼
- React Flow 기본 기능 지원:
  - 미니맵
  - 줌/팬 컨트롤
  - 노드 드래그 & 드롭
  - 노드 간 연결 (Edge)
- 완전 반응형 디자인 (태블릿, 모바일, 가로 모드 대응)

## 페이지 이동

1. **로그인 페이지**: 아이디와 비밀번호를 입력하고 로그인 버튼을 클릭
2. **설정 페이지**: 로그인 성공 후 자동으로 이동
3. **에디터 페이지**: 스토리 생성하기 버튼 클릭 후 이동
4. 간단한 상태 관리로 페이지 간 전환 구현

## 새 페이지 추가 방법

1. `src/pages/` 디렉토리 안에 새 폴더 생성
2. 폴더 안에 `PageName.tsx`와 `PageName.css` 파일 생성
3. `App.tsx`에서 라우팅 설정 추가

## 기술 스택

- React 18
- TypeScript
- CSS3 (Google Fonts: Imbue, Inknut Antiqua)
- React Flow (노드 에디터)
- Create React App
- 완전 반응형 디자인 (clamp, flexbox, grid)

## 반응형 대응

- **데스크톱**: 원본 Figma 디자인 비율 유지
- **태블릿**: 적절한 크기 조절과 레이아웃 최적화
- **모바일**: 터치 친화적 크기, 세로 레이아웃
- **가로 모드**: 가로 화면 전용 레이아웃
- **초소형/대형 화면**: 극한 화면 크기 지원

## 디자인 소스

- [로그인 페이지 Figma](https://www.figma.com/design/1ooaBTr7FHKOS3KlibQuEr/Untitled?node-id=1-2)
- [설정 페이지 Figma](https://www.figma.com/design/1ooaBTr7FHKOS3KlibQuEr/Untitled?node-id=1-18)
- [에디터 페이지 Figma](https://www.figma.com/design/1ooaBTr7FHKOS3KlibQuEr/Untitled?node-id=1-36)
