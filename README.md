# Nelson's DevParty

Jekyll 기반 개발 블로그.

## 기술 스택

- **Jekyll 4.3.4** - 정적 사이트 생성기
- **minimal-mistakes** - Jekyll 테마
- **Ruby 3.2.0** - 런타임
- **Bundler** - 의존성 관리

### 1. 의존성 설치
```bash
bundle install --path vendor/bundle
```

### 2. 개발 서버 실행

#### 방법 1: npm 스크립트 (권장)
```bash
npm run dev          # 개발 서버 (live reload + 증분 빌드)
npm run serve        # 기본 서버
npm run build        # 빌드만
npm run clean        # 빌드 파일 정리
```

#### 방법 2: rake 태스크
```bash
rake dev             # 개발 서버 (live reload + 증분 빌드)
rake serve           # 기본 서버  
rake build           # 빌드만
rake clean           # 빌드 파일 정리
rake                 # 기본값 (dev와 동일)
```

#### 방법 3: 직접 명령어
```bash
bundle exec jekyll serve --incremental --livereload
```

### 3. 접속
- **로컬 서버**: http://localhost:4000
- **Jekyll Admin**: http://localhost:4000/admin

## 포스트 작성

### 새 포스트 생성
```bash
# _posts/ 폴더에 파일 생성
# 파일명 형식: YYYY-MM-DD-제목.md
_posts/2024-01-01-example-post.md
```

### Front Matter 예시
```yaml
---
layout: single
title: "포스트 제목"
date: 2024-01-01 12:00:00 +0900
categories: [category1, category2]
tags: [tag1, tag2]
---

포스트 내용...
```

## 테마 설정

### 스킨 변경
`_config.yml`
```yaml
minimal_mistakes_skin: "dark"  # default, air, aqua, contrast, dark, dirt, neon, mint, plum, sunrise
```

### 설정 변경 후 재시작 필요
`_config.yml` 변경 시에는 서버를 재시작

## 배포

GitHub Pages에서 자동으로 배포

## 🔧 주요 업데이트

- ✅ Jekyll 3.8.7 → 4.3.4 업그레이드
- ✅ jQuery 3.3.1 → 3.7.1 (XSS 취약점 해결)
- ✅ kramdown 1.x → 2.5.1 (보안 취약점 해결)
- ✅ SCSS deprecation warnings 제거
- ✅ 다크 테마 코드블록 가독성 개선

## 📞 문의

- **Blog**: https://ssipflow.github.io
- **Email**: ssipflow@gmail.com
- **GitHub**: [@ssipflow](https://github.com/ssipflow)
