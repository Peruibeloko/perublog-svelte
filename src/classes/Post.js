import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';

export class Post {
  constructor(data) {
    dayjs.extend(relativeTime);
    dayjs.locale('pt-br');

    this.title = data?.title || 'Pô, aí não amigão...';
    this.author = data?.author || 'Carlos';
    this.datetime = data?.datetime || null;
    this.dateStrings = this.getTimeStrings(this.datetime);
    this.post = data?.post || 'Foi caçar coisa que não devia, achou nada!';
  }

  getTimeStrings(datetime) {
    return [
      datetime ? `${dayjs(datetime).fromNow()} atrás` : 'há 13.2Bi de anos atrás',
      datetime ? `${dayjs(datetime).format('DD/MM/YYYY HH[h]mm')}` : '31/02/1999 25h30'
    ];
  }
}

export async function getPostCount() {
  const fetchData = await fetch('https://perublog.herokuapp.com/post/count');
  return await fetchData.json();
}
