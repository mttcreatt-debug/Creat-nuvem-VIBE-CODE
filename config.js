/* ============================================================
   ELITE DRAKO GYM — CONFIGURAÇÃO DO SITE
   Este é o único arquivo que precisa ser editado para colocar
   o site no ar com os dados reais da academia.
   ============================================================ */
window.DRAKO_CONFIG = {
  // WhatsApp oficial, só números, com DDI 55 e DDD. Ex.: "5575999998888".
  // Enquanto estiver vazio, pedidos e cadastros abrem o direct do Instagram.
  whatsapp: "",

  instagram: "elite_drakogym",

  // Endereço completo (aparece no rodapé e na página de cadastro).
  // Fonte: cadastro da Receita Federal (CNPJ 62.441.242/0001-78) e o post de inauguração; CEP 48891-080.
  endereco: "Rodovia BA-120, 601, 1º andar, Antônio Lopes, Valente-BA",

  // Supabase: crie o projeto em supabase.com, rode o arquivo supabase/schema.sql
  // no SQL Editor e cole aqui a URL e a chave "anon public" (Settings → API).
  // A chave anon é pública por natureza: quem protege os dados são as regras (RLS) do schema.
  supabaseUrl: "",
  supabaseAnonKey: ""
};
