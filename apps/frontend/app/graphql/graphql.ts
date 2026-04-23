/* eslint-disable */
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
};

export type AuthLinkIssuePayload = {
  __typename?: 'AuthLinkIssuePayload';
  expiresAt: Scalars['DateTime']['output'];
  token: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createAuthLink: AuthLinkIssuePayload;
};


export type MutationCreateAuthLinkArgs = {
  createdBy: Scalars['String']['input'];
  patient: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  validateRegistrationLink: ValidatedRegistrationLinkPayload;
};


export type QueryValidateRegistrationLinkArgs = {
  token: Scalars['String']['input'];
};

export type ValidatedRegistrationLinkPayload = {
  __typename?: 'ValidatedRegistrationLinkPayload';
  patient: Scalars['String']['output'];
  uuid: Scalars['String']['output'];
};

export type ValidateRegistrationLinkQueryVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type ValidateRegistrationLinkQuery = { __typename?: 'Query', validateRegistrationLink: { __typename?: 'ValidatedRegistrationLinkPayload', uuid: string, patient: string } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const ValidateRegistrationLinkDocument = new TypedDocumentString(`
    query ValidateRegistrationLink($token: String!) {
  validateRegistrationLink(token: $token) {
    uuid
    patient
  }
}
    `) as unknown as TypedDocumentString<ValidateRegistrationLinkQuery, ValidateRegistrationLinkQueryVariables>;