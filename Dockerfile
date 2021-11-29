FROM node:16

WORKDIR /
RUN git clone https://github.com/wolfcw/libfaketime.git
WORKDIR /libfaketime/src
RUN make install

WORKDIR /app

COPY . .

RUN npm i
RUN npm run -w backend seed:run

EXPOSE 3001
EXPOSE 3000
CMD LD_PRELOAD=/usr/local/lib/faketime/libfaketime.so.1 FAKETIME_NO_CACHE=1 FAKETIME="+0d" npm run start
