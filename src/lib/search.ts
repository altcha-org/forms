import { create, insert } from '@orama/orama';
import { afterInsert as highlightAfterInsert, searchWithHighlight } from '@orama/plugin-match-highlight';
import type { FlattenSchemaProperty, Orama, PartialSchemaDeep, Schema } from '@orama/orama';

export class Search<T extends Record<string, 'string' | 'string[]' | 'number' | 'number[]' | 'boolean' | 'boolean[]' | 'enum' | 'enum[]'>> {
  orama?: Orama<T>;

  finalized: boolean = false;

  constructor(readonly schema: T) {
  }

  get size() {
    return this.orama?.data.docs.count || null;
  }

  reset() {
    this.orama = void 0;
  }

  async getOrama() {
    if (!this.orama) {
      this.orama = await create<T>({
        schema: this.schema,
        plugins: [
          {
            name: 'highlight',
            afterInsert: highlightAfterInsert
          }
        ],
      });
    }
    return this.orama;
  }

  async put(doc: PartialSchemaDeep<Schema<T>>) {
    const db = await this.getOrama();
    await insert(db, doc);
  }

  async search(term: string, properties?: FlattenSchemaProperty<Orama<T>>[]) {
    const db = await this.getOrama();
    const results = await searchWithHighlight(db, {
      term,
      mode: 'fulltext',
      limit: 30,
      properties,
    });
    return results;
  }
}

export const formsSearch = new Search({
  name: 'string'
});

export const responsesSearch = new Search({
  emailField: 'string',
  primaryField: 'string',
  secondaryField: 'string',
  otherFields: 'string'
});