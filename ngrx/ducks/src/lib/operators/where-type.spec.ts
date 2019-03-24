import { Action as NgRxAction } from '@ngrx/store';
import { from, Observable, of } from 'rxjs';
import { StoreMock } from '../../../test/mocks';
import { Action } from '../decorators';
import { ducksify } from '../ducks';
import { whereType } from './where-type';

describe('operators: whereType', () => {
  describe('effect dispatcher', () => {
    describe('When a type of a emitted action matches', () => {
      it('should pass the stream', done => {
        const action = { type: '[Counter]', payload: true };

        const booleanEffectDispatcher = effectDispatcher<number>(action.type);

        const actions$: Observable<NgRxAction> = of(action);

        actions$.pipe(whereType(booleanEffectDispatcher)).subscribe({
          next: ({ payload }) => {
            expect(payload).toBe(true);
            done();
          }
        });
      });

      it('SMOKE: should not provide a payload when it is not defined', done => {
        const action = { type: '[Counter]', payload: true };

        const noPayload = {
          type: action.type,
          dispatch: () => ({})
        };

        const actions$: Observable<NgRxAction> = of(action);

        actions$.pipe(whereType(noPayload)).subscribe({
          next: a => {
            expect(a.type).toBe(action.type);
            done();
          }
        });
      });
    });

    describe('When a type of a emitted action does not match', () => {
      it('should not pass the stream', () => {
        const action = { type: '[Counter]', payload: true };
        const forBoolean = effectDispatcher(action.type + 'salt');
        const actions$: Observable<NgRxAction> = of(action);

        const observer = { next: () => ({}) };
        const observerSpy = jest.spyOn(observer, 'next');

        actions$.pipe(whereType(forBoolean)).subscribe(observer);
        expect(observerSpy).not.toBeCalled();
      });
    });

    describe('When multiple types are triggering an effect', () => {
      it('should pass the stream', () => {
        const actions = [
          { type: '[1]', payload: true },
          { type: '[2]', payload: true },
          { type: '[3]', payload: true }
        ];

        const forBoolean = effectDispatcher<boolean>(actions[0].type);
        const forString = effectDispatcher<string>(actions[1].type);
        const forNumber = effectDispatcher<number>(actions[2].type);

        const actions$: Observable<NgRxAction> = from(actions);

        const observer = { next: () => ({}) };
        const observerSpy = jest.spyOn(observer, 'next');

        actions$
          .pipe(whereType([forBoolean, forString, forNumber]))
          .subscribe(observer);

        expect(observerSpy).toBeCalledTimes(3);
      });
    });
  });

  describe('self dispatching action', () => {
    describe('When a type of the emitted action matches', () => {
      class Duck {
        @Action('[Counter] Pick')
        eat(state: any, payload: boolean) {
          return state;
        }
      }

      it('should pass the stream', done => {
        const storeMock = new StoreMock({});
        const action = { type: '[Counter] Pick', payload: true };
        const duck = ducksify(Duck, storeMock as any);

        const actions$: Observable<NgRxAction> = of(action);

        actions$.pipe(whereType(duck.eat)).subscribe({
          next: ({ payload }) => {
            expect(payload).toBe(true);
            done();
          }
        });
      });
    });
  });
});

function effectDispatcher<T>(type: string) {
  return {
    type,
    dispatch: (_payload: T) => ({})
  };
}
