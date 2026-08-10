// ============================================================================
// Harness de teste do Engine de Soluções (scratch — NÃO faz parte do build).
//
// Uso:
//   DATABASE_URL="postgresql://postgres:...@db.xzz...supabase.co:5432/postgres" ^
//   node scripts/test-solution-engine.mjs
//
// Cria um usuário/auth + cliente descartáveis, materializa a solução completa
// (todas as conditions = true), valida contagens/datas/dependências/idempotência/
// reschedule/progress, e apaga tudo ao final. Não imprime segredos.
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnvLocal() {
  const env = {};
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// Predição independente da spec (não usa o engine — evita teste circular).
function predictCounts(structure, config) {
  let subtasks = 0;
  let recurrences = 0;
  const byMilestone = {};

  for (const card of structure.cards) {
    const cond = card.condition || {};
    const active = Object.keys(cond).length === 0 || Object.keys(cond).every((k) => config[k] === true);
    if (!active) continue;
    for (const st of card.subtasks) {
      subtasks++;
      byMilestone[card.milestone] = (byMilestone[card.milestone] ?? 0) + 1;
    }
  }

  for (const r of structure.recurrences ?? []) {
    const cond = r.condition || {};
    const active = Object.keys(cond).length === 0 || Object.keys(cond).every((k) => config[k] === true);
    if (!active) continue;
    for (let o = r.start_offset; o <= r.end_offset; o += r.step_days) recurrences++;
  }

  return { subtasks, recurrences, total: subtasks + recurrences, byMilestone };
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
}

const env = loadEnvLocal();
const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !anonKey) throw new Error('VITE_SUPABASE_URL/ANON_KEY ausentes em .env.local');
if (!databaseUrl) throw new Error('Defina DATABASE_URL (conexão postgres direta) para criar o usuário de teste');
console.log(`Supabase: ${supabaseUrl}`);

const pool = new Pool({ connectionString: databaseUrl, max: 2 });

async function main() {
  const userId = crypto.randomUUID();
  const email = `engine-test-${Date.now()}@caen.test`;
  const password = 'Eng#Test2026!';

  // 1. Usuário auth descartável + profile admin (necessário p/ políticas RLS)
  try {
    const r = await pool.query(
      `insert into auth.users
        (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
         raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user,
         confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token,
         email_change, phone_change)
       values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2,
         extensions.crypt($3, extensions.gen_salt('bf', 10)), now(),
         '{"provider":"email","providers":["email"]}', '{}', now(), now(), false,
         encode(gen_random_bytes(24), 'hex'), encode(gen_random_bytes(24), 'hex'),
         encode(gen_random_bytes(24), 'hex'), encode(gen_random_bytes(24), 'hex'), encode(gen_random_bytes(24), 'hex'),
         '', '')`,
      [userId, email, password],
    );
    console.log(`auth.users insert: rowCount=${r.rowCount}`);
    const back = await pool.query('select email, encrypted_password is not null as has_pass, email_confirmed_at from auth.users where id = $1', [userId]);
    console.log('auth.users back:', JSON.stringify(back.rows[0] ?? 'NULO'));
  } catch (err) {
    console.error('Falha ao criar usuário de teste:', err.message);
    try {
      await pool.query('delete from public.profiles where id = $1', [userId]);
      await pool.query('delete from auth.users where id = $1', [userId]);
    } catch {}
    await pool.end();
    process.exit(1);
  }

  await pool.query(
    `insert into public.profiles (id, full_name, email, role)
     values ($1, 'Engine Test', $2, 'admin')
     on conflict (id) do update set role = 'admin', full_name = 'Engine Test', email = excluded.email`,
    [userId, email],
  );

  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signIn, error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError || !signIn?.session) {
    console.error('Falha no sign-in do usuário de teste:', JSON.stringify(signInError));
    process.exit(1);
  }
  console.log(`Auth OK (usuário de teste: ${email})`);

  // 2. Versão atual
  const { data: versionRow, error: versionError } = await client
    .from('solution_versions')
    .select('id, version, structure')
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (versionError || !versionRow) {
    console.error('Versão corrente não encontrada:', versionError?.message);
    await cleanupUser(pool, userId);
    process.exit(1);
  }
  console.log(`Versão alvo: ${versionRow.version}`);

  // 3. Cliente descartável
  const { data: testClient, error: clientError } = await client
    .from('clients')
    .insert({ name: `[TESTE] Engine ${Date.now()}`, email: `engine-client-${Date.now()}@caen.test`, status: 'active' })
    .select('id')
    .single();
  if (clientError || !testClient) {
    console.error('Falha ao criar cliente de teste:', clientError?.message);
    await cleanupUser(pool, userId);
    process.exit(1);
  }

  const config = {
    needs_crm: true,
    social_media: true,
    meta_ads: true,
    ia_sdr: true,
    needs_lp: true,
    needs_site: true,
    google_ads: true,
    commercial_team: true,
  };
  const startDate = '2026-08-01';
  const expected = predictCounts(versionRow.structure, config);
  console.log(`Predição: subtasks=${expected.subtasks}, recorrências=${expected.recurrences}, total=${expected.total}`);

  const { createSolutionEngine } = await import('../src/services/solution.engine.ts');
  const engine = createSolutionEngine(client);

  try {
    // 4. instantiate
    const inst = await engine.instantiate({
      clientId: testClient.id,
      versionId: versionRow.id,
      startDate,
      config,
      userId,
    });
    check('instantiate: novas tasks', inst.created === true);
    check('instantiate: tasksCreated = predição', inst.tasksCreated === expected.total,
      `engine=${inst.tasksCreated}, predição=${expected.total}`);
    check('instantiate: end_date = start + 179', inst.instance.end_date === addDays(startDate, 179),
      `end_date=${inst.instance.end_date}`);

    // 5. banco
    const { count: dbCount } = await client
      .from('tasks').select('id', { count: 'exact', head: true })
      .eq('solution_instance_id', inst.instance.id);
    check('banco: total de tasks', dbCount === expected.total, `contagem=${dbCount}`);

    const { data: allKeys } = await client
      .from('tasks').select('template_key')
      .eq('solution_instance_id', inst.instance.id);
    check('banco: template_key únicos', new Set(allKeys.map((k) => k.template_key)).size === allKeys.length,
      `${new Set(allKeys.map((k) => k.template_key)).size}/${allKeys.length}`);

    const { count: recurCount } = await client
      .from('tasks').select('id', { count: 'exact', head: true })
      .eq('solution_instance_id', inst.instance.id).is('milestone', null);
    check('banco: recorrências (milestone null)', recurCount === expected.recurrences, `contagem=${recurCount}`);

    const { count: orphanTasks } = await client
      .from('tasks').select('id', { count: 'exact', head: true })
      .eq('client_id', testClient.id).is('solution_instance_id', null);
    check('banco: nenhuma task sem instância', orphanTasks === 0, `contagem=${orphanTasks}`);

    // 6. datas (day_offset = 1 => start_date)
    const fetchTask = async (key) => {
      const { data } = await client
        .from('tasks').select('id, due_date, day_offset, depends_on_task_ids')
        .eq('template_key', key).eq('solution_instance_id', inst.instance.id).single();
      return data;
    };
    const t1 = await fetchTask('m1.diagnostico.entrega');
    const t30 = await fetchTask('m1.gestao.fechamento');
    const t180 = await fetchTask('recur.monitoramento@180');
    check('data: offset 1 => start', t1?.due_date === startDate, `due=${t1?.due_date}`);
    check('data: offset 30 => +29d', t30?.due_date === addDays(startDate, 29), `due=${t30?.due_date}`);
    check('data: recurrência @180 => +179d', t180?.due_date === addDays(startDate, 179), `due=${t180?.due_date}`);

    // 7. dependências resolvidas (sem enforcement)
    const depCriacao = await fetchTask('m5.traffic.campaign_03.criacao');
    const depTarget = await fetchTask('m1.traffic.meta_campaign_01');
    const playbook = await fetchTask('m6.playbook.comercial');
    check('deps: campanha_03 -> meta_campaign_01', depCriacao?.depends_on_task_ids?.length === 1 && depCriacao.depends_on_task_ids[0] === depTarget.id);
    check('deps: playbook comercial -> 3 deps', playbook?.depends_on_task_ids?.length === 3, `len=${playbook?.depends_on_task_ids?.length}`);

    // 8. idempotência
    const again = await engine.instantiate({
      clientId: testClient.id,
      versionId: versionRow.id,
      startDate,
      config,
      userId,
    });
    check('idempotência: retorna instância existente', again.created === false && again.instance.id === inst.instance.id);
    check('idempotência: mesmo total', again.tasksCreated === expected.total, `total=${again.tasksCreated}`);

    // 9. reschedule (só tasks não concluídas)
    await client.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', t1.id);
    const newStart = '2026-08-16';
    const res = await engine.reschedule(inst.instance.id, newStart);
    check('reschedule: start_date', res.start_date === newStart);
    check('reschedule: end_date', res.end_date === addDays(newStart, 179), `end=${res.end_date}`);
    const doneTask = await fetchTask('m1.diagnostico.entrega');
    const shiftedTask = await fetchTask('m1.process.process_commercial');
    check('reschedule: task concluída inalterada', doneTask.due_date === startDate, `due=${doneTask.due_date}`);
    check('reschedule: task pendente recalculada', shiftedTask.due_date === addDays(newStart, 1), `due=${shiftedTask.due_date}`);

    // 10. pause / resume / remove
    const paused = await engine.pause(inst.instance.id);
    check('pause: status', paused.status === 'paused');
    const resumed = await engine.resume(inst.instance.id);
    check('resume: status', resumed.status === 'active');

    // 11. progresso
    const prog = await engine.getProgress(inst.instance.id);
    check('progress: total', prog.total === expected.total, `total=${prog.total}`);
    check('progress: done', prog.done === 1, `done=${prog.done}`);
    check('progress: byMilestone.m1', prog.byMilestone['m1']?.total === expected.byMilestone['m1'],
      `m1=${prog.byMilestone['m1']?.total}, predição=${expected.byMilestone['m1']}`);

    const milestonesKeys = Object.keys(prog.byMilestone);
    check('progress: 6 marcos', milestonesKeys.length === 6, milestonesKeys.join(','));

    // 12. cleanup
    await client.from('clients').delete().eq('id', testClient.id);
    console.log('Cleanup: cliente de teste removido (tasks cascateadas)');
  } catch (err) {
    check('EXECUÇÃO SEM ERRO', false, err.message);
    console.error('Erro durante o teste:', err);
    try { await client.from('clients').delete().eq('id', testClient.id); } catch {}
  } finally {
    await cleanupUser(pool, userId);
  }

  await pool.end();
  await client.auth.signOut().catch(() => null);

  // ------------------------------------------------------------------ resumo
  const failed = results.filter((r) => !r.ok);
  console.log('\n================ RESULTADOS ================');
  for (const r of results) {
    console.log(`${r.ok ? '  PASS' : '  FAIL'}  ${r.name}${r.detail ? `  [${r.detail}]` : ''}`);
  }
  console.log('============================================');
  console.log(`${results.length - failed.length}/${results.length} passaram`);
  process.exit(failed.length > 0 ? 1 : 0);
}

async function cleanupUser(pool, userId) {
  try { await pool.query('delete from public.profiles where id = $1', [userId]); } catch {}
  try { await pool.query('delete from auth.users where id = $1', [userId]); } catch {}
}

main().catch((err) => {
  console.error('Falha fatal:', err);
  process.exit(1);
});