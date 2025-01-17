import { Type, Static, } from '@sinclair/typebox';

import { SemVerType } from '../../pieces';

export enum ActionType {
  CODE = 'CODE',
  PIECE = 'PIECE',
  LOOP_ON_ITEMS = 'LOOP_ON_ITEMS',
  BRANCH = 'BRANCH',
}

const commonActionProps = {
  name: Type.String({}),
  valid: Type.Boolean({}),
  displayName: Type.String({}),
}

// Code Action

export const CodeActionSettings = Type.Object({
  artifactSourceId: Type.Optional(Type.String({})),
  artifactPackagedId: Type.Optional(Type.String({})),
  artifact: Type.Optional(Type.String({})),
  input: Type.Record(Type.String({}), Type.Any()),
});


export type CodeActionSettings = Static<typeof CodeActionSettings>;

export const CodeActionSchema = Type.Object({
  ...commonActionProps,
  type: Type.Literal(ActionType.CODE),
  settings: CodeActionSettings
});


// Piece Action
export const PieceActionSettings = Type.Object({
  pieceName: Type.String({}),
  pieceVersion: SemVerType,
  actionName: Type.Optional(Type.String({})),
  input: Type.Record(Type.String({}), Type.Any()),
  inputUiInfo: Type.Record(Type.String({}), Type.Any())
});

export type PieceActionSettings = Static<typeof PieceActionSettings>;

export const PieceActionSchema = Type.Object({
  ...commonActionProps,
  type: Type.Literal(ActionType.PIECE),
  settings: PieceActionSettings,
});

// Loop Items
export const LoopOnItemsActionSettingsWithValidation = Type.Object({
  items: Type.String({minLength: 1})
});
export type LoopOnItemsActionSettingsWithValidation = Static<typeof LoopOnItemsActionSettings>;


export const LoopOnItemsActionSettings = Type.Object({
  items: Type.String()
});

export type LoopOnItemsActionSettings = Static<typeof LoopOnItemsActionSettings>;

export const LoopOnItemsActionSchema = Type.Object({
  ...commonActionProps,
  type: Type.Literal(ActionType.LOOP_ON_ITEMS),
  settings: LoopOnItemsActionSettings,
});

// Loop Items

export enum BranchOperator {
  TEXT_CONTAINS = 'TEXT_CONTAINS',
  TEXT_DOES_NOT_CONTAIN = 'TEXT_DOES_NOT_CONTAIN',
  TEXT_EXACTLY_MATCHES = 'TEXT_EXACTLY_MATCHES',
  TEXT_DOES_NOT_EXACTLY_MATCH = 'TEXT_DOES_NOT_EXACTLY_MATCH',
  TEXT_STARTS_WITH = 'TEXT_START_WITH',
  TEXT_DOES_NOT_START_WITH = 'TEXT_DOES_NOT_START_WITH',
  TEXT_ENDS_WITH = 'TEXT_ENDS_WITH',
  TEXT_DOES_NOT_END_WITH = 'TEXT_DOES_NOT_END_WITH',
  NUMBER_IS_GREATER_THAN = 'NUMBER_IS_GREATER_THAN',
  NUMBER_IS_LESS_THAN = 'NUMBER_IS_LESS_THAN',
  BOOLEAN_IS_TRUE = 'BOOLEAN_IS_TRUE',
  BOOLEAN_IS_FALSE = 'BOOLEAN_IS_FALSE',
  EXISTS = 'EXISTS',
  DOES_NOT_EXIST = 'DOES_NOT_EXIST',
}

export const singleValueConditions = [
  BranchOperator.EXISTS,
  BranchOperator.DOES_NOT_EXIST,
  BranchOperator.BOOLEAN_IS_TRUE,
  BranchOperator.BOOLEAN_IS_FALSE
]

const BranchConditionValid = (addMinLength: boolean) => Type.Union([
  Type.Object({
    firstValue: addMinLength ? Type.String({ minLength: 1 }) : Type.String(),
    secondValue: addMinLength ? Type.String({ minLength: 1 }) : Type.String(),
    operator: Type.Optional(Type.Union([...Object.values(BranchOperator).
      filter(c => singleValueConditions.find(sc => sc === c) === undefined).map(c => {
        return Type.Literal(c)
      })]))
  }),
  Type.Object({
    firstValue: addMinLength ? Type.String({ minLength: 1 }) : Type.String(),
    operator: Type.Optional(Type.Union([...Object.values(BranchOperator).
      filter(c => singleValueConditions.find(sc => sc === c) !== undefined).map(c => {
        return Type.Literal(c)
      })]))
  })
]);

export const BranchActionSettingsWithValidation = Type.Object({
  conditions: Type.Array(Type.Array(BranchConditionValid(true))),
})

export const BranchCondition = BranchConditionValid(false);
export type BranchCondition = Static<typeof BranchCondition>;

export const BranchActionSettings = Type.Object({
  conditions: Type.Array(Type.Array(BranchConditionValid(false))),
})
export type BranchActionSettings = Static<typeof BranchActionSettings>;

export const BranchActionSchema = Type.Object({
  ...commonActionProps,
  type: Type.Literal(ActionType.BRANCH),
  settings: BranchActionSettings
});

// Union of all actions

export const Action = Type.Recursive(action => Type.Union([
  Type.Intersect([CodeActionSchema, Type.Object({
    nextAction: Type.Optional(action),
  })]),
  Type.Intersect([PieceActionSchema, Type.Object({
    nextAction: Type.Optional(action),
  })]),
  Type.Intersect([LoopOnItemsActionSchema, Type.Object({
    nextAction: Type.Optional(action),
    firstLoopAction: Type.Optional(action)
  })]),
  Type.Intersect([BranchActionSchema, Type.Object({
    nextAction: Type.Optional(action),
    onSuccessAction: Type.Optional(action),
    onFailureAction: Type.Optional(action)
  })])
]));

export type Action = Static<typeof Action>;

export type BranchAction = Static<typeof BranchActionSchema> & { nextAction?: Action, onFailureAction?: Action, onSuccessAction?: Action };

export type LoopOnItemsAction = Static<typeof LoopOnItemsActionSchema> & { nextAction?: Action, firstLoopAction?: Action };

export type PieceAction = Static<typeof PieceActionSchema> & { nextAction?: Action };

export type CodeAction = Static<typeof CodeActionSchema> & { nextAction?: Action };
