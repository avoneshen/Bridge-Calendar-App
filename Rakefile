require "bundler/gem_tasks"
require "rspec/core/rake_task"

task default: :spec
task test: :spec
desc 'Run all specs in spec directory (excluding plugin specs)'
RSpec::Core::RakeTask.new(:spec)