import { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseRepository<T> {
  protected constructor(
    protected readonly supabase: SupabaseClient,
    protected readonly tableName: string
  ) {}

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Error fetching ${this.tableName} by id: ${error.message}`);
    return data as T;
  }

  async create(payload: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(payload)
      .select('*')
      .single();

    if (error) throw new Error(`Error creating ${this.tableName}: ${error.message}`);
    return data as T;
  }

  async update(id: string, payload: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Error updating ${this.tableName}: ${error.message}`);
    return data as T;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error deleting from ${this.tableName}: ${error.message}`);
    return true;
  }
}
