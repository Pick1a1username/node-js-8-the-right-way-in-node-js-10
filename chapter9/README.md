# ???

## esclu

```
./esclu create-index --index books
```

```
curl -X PUT http://localhost:9200/books/
```

```
./esclu get '_cat/indices?v'
```

```
curl http://localhost:9200/_cat/indices?v
```

```
./esclu bulk ../data/bulk_pg.ldj -i books -t book > ../data/bulk_result.json
```

```
curl -X POST -H "Content-Type: application/json" -H "content-length: ????" http://localhost:9200/books/book/_bulk
```