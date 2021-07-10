SET NAMES utf8;

CREATE TABLE IF NOT EXISTS file (
  path varchar(1000) NOT NULL UNIQUE,
  size bigint(14) NOT NULL,
  atime datetime NOT NULL,
  mtime datetime NOT NULL,
  ctime datetime NOT NULL,
  hash char(40),
  
  PRIMARY KEY (path)
) DEFAULT CHARSET=utf8 ;