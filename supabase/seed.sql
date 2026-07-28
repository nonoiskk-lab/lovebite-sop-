-- Demo seed for local dev. Matches the actors/SOPs used by the in-memory store.
insert into restaurants (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Lovebite — MG Road');

insert into users (id, restaurant_id, full_name, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Ravi Kumar', 'kitchen', 'ravi@lovebite.example'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Meera Iyer', 'foh', 'meera@lovebite.example'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'Aisha Sen', 'manager', 'aisha@lovebite.example');

insert into sops (restaurant_id, slug, name, role, scheduled_at, icon, steps)
values
  ('00000000-0000-0000-0000-000000000001', 'opening', 'Opening Checklist', 'kitchen', '6:45 AM', 'Sun',
   '["before","checklist","after","review"]'),
  ('00000000-0000-0000-0000-000000000001', 'temp', 'Temperature Log', 'kitchen', '11:00 AM', 'Thermometer',
   '["readings","photo","review"]'),
  ('00000000-0000-0000-0000-000000000001', 'cash', 'Closing Cash Reconciliation', 'foh', '10:30 PM', 'CashRegister',
   '["count","pos","photo","review"]');
