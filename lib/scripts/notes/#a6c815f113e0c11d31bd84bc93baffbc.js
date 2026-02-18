let [count, version] = store.get("key")                     || [0,0]
count += arg;
version += 1;
store.set("key", [count,version])
return [count, version]                    ;
