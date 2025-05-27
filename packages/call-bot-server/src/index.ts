import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { parse } from 'csv-parse/sync';

const app = express();
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

interface User {
  id: string;
  companyId: string;
  role: 'super' | 'admin' | 'user';
  username: string;
  password: string;
}

interface Company {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  companyId: string;
  name: string;
  phone: string;
}

interface CallLog {
  id: string;
  companyId: string;
  contactId: string;
  transcript?: string;
}

const users: User[] = [
  { id: '1', companyId: '1', role: 'super', username: 'admin', password: 'admin' }
];
const companies: Company[] = [ { id: '1', name: 'Default' } ];
const contacts: Contact[] = [];
const callLogs: CallLog[] = [];

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send('missing auth');
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = payload;
    next();
  } catch (e) {
    res.status(401).send('invalid auth');
  }
}

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).send('invalid credentials');
  const token = jwt.sign({ id: user.id, companyId: user.companyId, role: user.role }, JWT_SECRET);
  res.json({ token });
});

app.get('/contacts', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const companyContacts = contacts.filter(c => c.companyId === user.companyId);
  res.json(companyContacts);
});

app.post('/contacts', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { name, phone } = req.body;
  const contact: Contact = { id: String(Date.now()), companyId: user.companyId, name, phone };
  contacts.push(contact);
  res.json(contact);
});

app.post('/contacts/upload', authenticate, upload.single('file'), (req, res) => {
  const user = (req as any).user as User;
  const file = req.file;
  if (!file) return res.status(400).send('missing file');
  const records = parse(file.buffer.toString(), { columns: true });
  for (const record of records) {
    contacts.push({
      id: String(Date.now()) + Math.random(),
      companyId: user.companyId,
      name: record.name,
      phone: record.phone
    });
  }
  res.sendStatus(201);
});

app.post('/campaigns/start', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const companyContacts = contacts.filter(c => c.companyId === user.companyId);
  for (const contact of companyContacts) {
    // TODO integrate with Vapi.ai SDK
    callLogs.push({ id: String(Date.now()), companyId: user.companyId, contactId: contact.id });
  }
  res.sendStatus(200);
});

app.get('/call-logs', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const logs = callLogs.filter(l => l.companyId === user.companyId);
  res.json(logs);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));
