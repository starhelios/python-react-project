FROM node:8

RUN mkdir /app
COPY char_size.json /app/
COPY static /app/static
COPY src /app/src
COPY package.json /app/
COPY global_consts.json /app/
COPY webpack.config.js /app/
WORKDIR /app
RUN yarn install
RUN yarn global add webpack@1.14.0
RUN NODE_ENV=production webpack --production

FROM python:3
RUN mkdir /app
COPY --from=0 /app/static /app/static
WORKDIR /app
COPY requirements.txt /app
COPY *.py /app/
COPY global_consts.json /app/
COPY rsyslog.conf /etc/
ADD templates /app/templates
WORKDIR /app
RUN pip install -r requirements.txt
RUN apt-get update -y
EXPOSE 8080
CMD ["python", "application.py"]
