# download csv of data sources
require 'open-uri'
require 'csv'
require 'json'

url =  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrd67BGb9FMpxJeK_OiZfZo6UxYikHW6D7shfna7Z7dp5DdbqA5VSvLCjwlXF2jPpJxETsyt2DeHRM/pub?output=csv"

download = open(url)
IO.copy_stream(download, './json/sources.csv')

# for each row

sources = CSV.open('./json/sources.csv', headers: true).readlines

sources.each do |source|
  file_url = source['CSV']
  print source
  download = open(file_url)
  # download csv
  IO.copy_stream(download, './json/source.csv') 
  lines = CSV.open('./json/source.csv').readlines
  keys = lines.delete lines.first
  # keys.map! { |k| k.nil? ? "ID" : k.capitalize.gsub(/_(\w)/){$1.upcase}.gsub(/%/, "Percent")  }
  keys.map! { |k| k.nil? ? "ID" : k  }
  # export to json with file name
  File.open('./json/'+source['Output']+'.json', 'w') do |f|
    data = lines.map do |values|
      Hash[keys.zip(values)]
    end
    f.puts JSON.pretty_generate(data)
  end
end


