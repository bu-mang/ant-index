import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// TypeORM이나 Mongoose는 Nest.js용 공식 통합 패키지가 있다.
// Drizzle은 공식 Nest.js 모듈이 없다. 그래서 선택한 코드처럼 직접 provider를 만들어서 등록하는 것.
// 'drizzle' 토큰으로 등록 → 다른 서비스에서 @Inject('drizzle')로 가져다 쓸 수 있음
const drizzleProvider = {
  provide: 'drizzle',
  useFactory: () => {
    return drizzle(process.env.DATABASE_URL!, { schema });
  },
};

@Global() // 전역 모듈 — 어디서든 import 없이 사용 가능
@Module({
  providers: [drizzleProvider],
  exports: [drizzleProvider],
})
export class DatabaseModule {}
